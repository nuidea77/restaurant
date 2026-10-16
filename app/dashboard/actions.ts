"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DISTRICTS } from "@/lib/constants";
import { pricePerPerson } from "@/lib/pricing";
import { verifiedUserId } from "@/lib/guards";
import { sql } from "@/lib/db";
import { appOrigin } from "@/lib/origin";
import { confirmDemoPayment, startBylCheckout } from "@/lib/payments";
import { isOwnUploadUrl } from "@/lib/upload-path";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  // Утас баталгаажаагүй хэрэглэгч ресторан нэмж, засах боломжгүй.
  const userId = await verifiedUserId();
  if (!userId) throw new Error("Нэвтэрч, утсаа баталгаажуулна уу");
  return userId;
}

const optionalCoord = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().finite().nullable());

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Нэр оруулна уу").max(255),
  district: z.enum(DISTRICTS, { message: "Дүүрэг сонгоно уу" }),
  address: z.string().trim().min(1, "Хаяг оруулна уу"),
  phone: z.string().trim().min(6, "Утасны дугаар оруулна уу").max(50),
  capacity: z.coerce.number().int().positive("Багтаамж 0-ээс их байна"),
  description: z.string().trim().max(2000).optional().transform((v) => v || null),
  latitude: optionalCoord,
  longitude: optionalCoord,
  has_host: z.boolean(),
  has_stage: z.boolean(),
  has_screen: z.boolean(),
  has_parking: z.boolean(),
});

export async function saveProfile(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const userId = await requireUser();
  const parsed = ProfileSchema.safeParse({
    ...Object.fromEntries(form),
    has_host: form.get("has_host") === "on",
    has_stage: form.get("has_stage") === "on",
    has_screen: form.get("has_screen") === "on",
    has_parking: form.get("has_parking") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const d = parsed.data;
  const id = String(form.get("id") ?? "");

  if (id) {
    // Засах — зөвхөн өөрийн рестораныг.
    const rows = await sql`
      update restaurants set
        name = ${d.name}, district = ${d.district}, address = ${d.address}, phone = ${d.phone},
        capacity = ${d.capacity}, description = ${d.description}, latitude = ${d.latitude}, longitude = ${d.longitude},
        has_host = ${d.has_host}, has_stage = ${d.has_stage}, has_screen = ${d.has_screen}, has_parking = ${d.has_parking}
      where id = ${id}::uuid and owner_id = ${userId}
      returning id`.catch(() => []);
    if (rows.length === 0) return { ok: false, error: "Хадгалж чадсангүй" };
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  }

  // Шинэ ресторан — төлбөр төлөгдтөл нийтэд харагдахгүй (is_paid = false).
  const [created] = await sql<{ id: string }>`
    insert into restaurants (owner_id, name, district, address, phone, capacity, description,
      latitude, longitude, has_host, has_stage, has_screen, has_parking, is_paid)
    values (${userId}, ${d.name}, ${d.district}, ${d.address}, ${d.phone}, ${d.capacity}, ${d.description},
      ${d.latitude}, ${d.longitude}, ${d.has_host}, ${d.has_stage}, ${d.has_screen}, ${d.has_parking}, false)
    returning id`.catch(() => []);
  if (!created) return { ok: false, error: "Хадгалж чадсангүй" };

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/r/${created.id}/pay`);
}

export async function setImages(restaurantId: string, images: string[]): Promise<ActionResult> {
  const userId = await requireUser();
  // /demo/ — seed скриптийн демо зургууд.
  const allowed = (url: string) => isOwnUploadUrl(url, "images", userId) || /^\/demo\/[\w-]+\.svg$/.test(url);
  if (!images.every(allowed)) return { ok: false, error: "Буруу зургийн холбоос" };

  const rows = await sql`
    update restaurants set images = ${images} where id = ${restaurantId}::uuid and owner_id = ${userId} returning id`;
  if (rows.length === 0) return { ok: false, error: "Зураг хадгалж чадсангүй" };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

const PackageSchema = z.object({
  package_name: z.string().trim().min(1, "Багцын нэр оруулна уу").max(255),
  total_price: z.coerce.number().int().nonnegative(),
  person_count: z.coerce.number().int().min(1),
  items: z.array(z.string().trim()).transform((a) => a.filter(Boolean)),
});

export async function updatePackage(id: string, input: unknown, verify: boolean): Promise<ActionResult> {
  const userId = await requireUser();
  const parsed = PackageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const p = parsed.data;

  // Зөвхөн өөрийн рестораны багцыг шинэчилнэ.
  const rows = await sql`
    update menu_packages set
      package_name = ${p.package_name}, total_price = ${p.total_price}, person_count = ${p.person_count},
      price_per_person = ${pricePerPerson(p.total_price, p.person_count)}, items = ${JSON.stringify(p.items)}::jsonb,
      is_verified = ${verify}
    where id = ${id}::uuid and restaurant_id in (select id from restaurants where owner_id = ${userId})
    returning id`;
  if (rows.length === 0) return { ok: false, error: "Хадгалж чадсангүй" };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function deletePackage(id: string): Promise<ActionResult> {
  const userId = await requireUser();
  const rows = await sql`
    delete from menu_packages
    where id = ${id}::uuid and restaurant_id in (select id from restaurants where owner_id = ${userId})
    returning id`;
  if (rows.length === 0) return { ok: false, error: "Устгаж чадсангүй" };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Туршилтын (demo) төлбөр: нэхэмжлэхийг төлөгдсөн болгож рестораныг нийтэд нээнэ. */
export async function payListing(paymentId: string, restaurantId: string): Promise<ActionResult> {
  const userId = await requireUser();
  const paidRestaurant = await confirmDemoPayment(paymentId, userId);
  if (!paidRestaurant) return { ok: false, error: "Төлбөр баталгаажуулж чадсангүй" };
  revalidatePath("/", "layout");
  redirect(`/dashboard/r/${restaurantId}?paid=1`);
}

/** Byl.mn checkout үүсгээд хэрэглэгчийг Byl-ийн төлбөрийн хуудас руу шилжүүлнэ. */
export async function payWithByl(paymentId: string): Promise<ActionResult> {
  const userId = await requireUser();
  let url: string;
  try {
    url = await startBylCheckout(paymentId, userId, await appOrigin());
  } catch (err) {
    console.error("Byl checkout failed", err);
    return { ok: false, error: "Byl-тэй холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу." };
  }
  redirect(url);
}

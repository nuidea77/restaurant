"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DISTRICTS } from "@/lib/constants";
import { pricePerPerson } from "@/lib/pricing";
import { currentUserId } from "@/auth";
import { sql } from "@/lib/db";
import { isOwnUploadUrl } from "@/lib/upload-path";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const userId = await currentUserId();
  if (!userId) throw new Error("Нэвтэрнэ үү");
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
  try {
    await sql`
      insert into restaurants (owner_id, name, district, address, phone, capacity, description,
        latitude, longitude, has_host, has_stage, has_screen, has_parking)
      values (${userId}, ${d.name}, ${d.district}, ${d.address}, ${d.phone}, ${d.capacity}, ${d.description},
        ${d.latitude}, ${d.longitude}, ${d.has_host}, ${d.has_stage}, ${d.has_screen}, ${d.has_parking})
      on conflict (owner_id) do update set
        name = excluded.name, district = excluded.district, address = excluded.address, phone = excluded.phone,
        capacity = excluded.capacity, description = excluded.description, latitude = excluded.latitude,
        longitude = excluded.longitude, has_host = excluded.has_host, has_stage = excluded.has_stage,
        has_screen = excluded.has_screen, has_parking = excluded.has_parking`;
  } catch {
    return { ok: false, error: "Хадгалж чадсангүй" };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setImages(images: string[]): Promise<ActionResult> {
  const userId = await requireUser();
  if (!images.every((url) => isOwnUploadUrl(url, "images", userId))) return { ok: false, error: "Буруу зургийн холбоос" };

  const rows = await sql`update restaurants set images = ${images} where owner_id = ${userId} returning id`;
  if (rows.length === 0) return { ok: false, error: "Зураг хадгалж чадсангүй" };
  revalidatePath("/dashboard");
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

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePackage(id: string): Promise<ActionResult> {
  const userId = await requireUser();
  const rows = await sql`
    delete from menu_packages
    where id = ${id}::uuid and restaurant_id in (select id from restaurants where owner_id = ${userId})
    returning id`;
  if (rows.length === 0) return { ok: false, error: "Устгаж чадсангүй" };
  revalidatePath("/dashboard");
  return { ok: true };
}

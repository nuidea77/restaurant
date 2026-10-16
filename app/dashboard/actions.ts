"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DISTRICTS } from "@/lib/constants";
import { pricePerPerson } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false, error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нэвтэрнэ үү");
  return { supabase, user };
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
  const { supabase, user } = await requireUser();
  const parsed = ProfileSchema.safeParse({
    ...Object.fromEntries(form),
    has_host: form.get("has_host") === "on",
    has_stage: form.get("has_stage") === "on",
    has_screen: form.get("has_screen") === "on",
    has_parking: form.get("has_parking") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("restaurants")
    .upsert({ ...parsed.data, owner_id: user.id }, { onConflict: "owner_id" });
  if (error) return { ok: false, error: "Хадгалж чадсангүй" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setImages(images: string[]): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant-images/${user.id}/`;
  if (!images.every((url) => url.startsWith(base))) return { ok: false, error: "Буруу зургийн холбоос" };

  const { error } = await supabase.from("restaurants").update({ images }).eq("owner_id", user.id);
  if (error) return { ok: false, error: "Зураг хадгалж чадсангүй" };
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
  const { supabase } = await requireUser();
  const parsed = PackageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const p = parsed.data;

  // RLS нь зөвхөн өөрийн рестораны багцыг шинэчлэхийг зөвшөөрнө.
  const { error, count } = await supabase
    .from("menu_packages")
    .update(
      { ...p, price_per_person: pricePerPerson(p.total_price, p.person_count), is_verified: verify },
      { count: "exact" },
    )
    .eq("id", id);
  if (error || count === 0) return { ok: false, error: "Хадгалж чадсангүй" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePackage(id: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("menu_packages").delete().eq("id", id);
  if (error) return { ok: false, error: "Устгаж чадсангүй" };
  revalidatePath("/dashboard");
  return { ok: true };
}

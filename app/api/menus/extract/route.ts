import { NextResponse } from "next/server";
import { z } from "zod";
import { BUCKETS, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { extractMenuPackages } from "@/lib/vertex";

// Олон хуудастай PDF-ийг Gemini уншихад хугацаа шаардана.
export const maxDuration = 60;

const Body = z.object({ path: z.string().min(1) });

const MIME_BY_EXT: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  const { path } = parsed.data;
  if (!path.startsWith(`${user.id}/`) || path.includes("..")) {
    return NextResponse.json({ error: "Хандах эрхгүй файл" }, { status: 403 });
  }

  const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.id).maybeSingle();
  if (!restaurant) return NextResponse.json({ error: "Эхлээд рестораны профайлаа үүсгэнэ үү" }, { status: 400 });

  const mimeType = MIME_BY_EXT[path.split(".").pop()?.toLowerCase() ?? ""];
  if (!mimeType) return NextResponse.json({ error: "Зөвшөөрөгдөөгүй файлын төрөл" }, { status: 400 });

  const { data: blob, error: downloadError } = await supabase.storage.from(BUCKETS.menus.id).download(path);
  if (downloadError || !blob) return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 404 });
  if (blob.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Файл хэт том байна" }, { status: 400 });

  let packages;
  try {
    packages = await extractMenuPackages({ data: Buffer.from(await blob.arrayBuffer()), mimeType });
  } catch (err) {
    console.error("Vertex AI extraction failed", err);
    return NextResponse.json({ error: "AI цэсийг уншиж чадсангүй. Дахин оролдоно уу." }, { status: 502 });
  }

  if (packages.length === 0) {
    return NextResponse.json({ error: "Цэснээс багц олдсонгүй. Илүү тод файл оруулна уу.", packages: [] }, { status: 422 });
  }

  const fileUrl = supabase.storage.from(BUCKETS.menus.id).getPublicUrl(path).data.publicUrl;
  // Хүний хяналтаар баталгаажтал нийтэд харагдахгүй (is_verified = false).
  const { data: inserted, error } = await supabase
    .from("menu_packages")
    .insert(packages.map((p) => ({ ...p, restaurant_id: restaurant.id, file_url: fileUrl, is_verified: false })))
    .select();
  if (error) return NextResponse.json({ error: "Багц хадгалж чадсангүй" }, { status: 500 });

  return NextResponse.json({ packages: inserted });
}

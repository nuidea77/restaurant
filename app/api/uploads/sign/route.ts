import { NextResponse } from "next/server";
import { z } from "zod";
import { BUCKETS, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const Body = z.object({
  bucket: z.enum(["menus", "images"]),
  contentType: z.string(),
  size: z.number().int().positive(),
});

/**
 * Presigned upload URL олгоно. Файл Vercel функцээр дамжихгүй (4.5MB хязгаар),
 * клиент Supabase Storage руу шууд байршуулна.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  const { bucket, contentType, size } = parsed.data;
  const target = BUCKETS[bucket];

  if (!(target.mimeTypes as readonly string[]).includes(contentType)) {
    return NextResponse.json({ error: "Зөвшөөрөгдөөгүй файлын төрөл" }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файлын хэмжээ 10MB-аас ихгүй байна" }, { status: 400 });
  }

  const path = `${user.id}/${crypto.randomUUID()}.${EXT[contentType]}`;
  const { data, error } = await supabase.storage.from(target.id).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "Байршуулах холбоос үүсгэж чадсангүй" }, { status: 500 });

  const publicUrl = supabase.storage.from(target.id).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ bucket: target.id, path, token: data.token, publicUrl });
}

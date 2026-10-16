"use client";

import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

/** Presigned URL авч файлыг Supabase Storage руу шууд байршуулна. */
export async function directUpload(file: File, bucket: "menus" | "images") {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Файлын хэмжээ 10MB-аас ихгүй байна");

  const res = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, contentType: file.type, size: file.size }),
  });
  const signed = await res.json();
  if (!res.ok) throw new Error(signed.error ?? "Байршуулж чадсангүй");

  const { error } = await createClient()
    .storage.from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
  if (error) throw new Error("Байршуулж чадсангүй");

  return { path: signed.path as string, publicUrl: signed.publicUrl as string };
}

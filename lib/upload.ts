"use client";

import { MAX_UPLOAD_BYTES, type UploadFolder } from "@/lib/constants";

/** Файлыг сервер рүү илгээж локал хавтаст хадгална. Нийтийн URL буцаана. */
export async function directUpload(file: File, folder: UploadFolder) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Файлын хэмжээ 10MB-аас ихгүй байна");
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Байршуулж чадсангүй");
  return body.url as string;
}

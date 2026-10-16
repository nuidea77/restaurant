"use client";

import { upload } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES, type UploadFolder } from "@/lib/constants";

/** Токен авч файлыг Vercel Blob руу шууд байршуулна. Нийтийн URL буцаана. */
export async function directUpload(file: File, folder: UploadFolder, userId: string) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Файлын хэмжээ 10MB-аас ихгүй байна");
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+/, "") || "file";
  try {
    const blob = await upload(`${folder}/${userId}/${safeName}`, file, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      contentType: file.type,
    });
    return blob.url;
  } catch {
    throw new Error("Байршуулж чадсангүй. Файлын төрөл, хэмжээгээ шалгана уу.");
  }
}

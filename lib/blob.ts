import type { UploadFolder } from "@/lib/constants";

/** Vercel Blob-ийн нийтийн URL нь тухайн хэрэглэгчийн хавтсанд байгаа эсэх. */
export function isOwnBlobUrl(url: string, folder: UploadFolder, userId: string) {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith(`/${folder}/${userId}/`) &&
      !u.pathname.includes("..")
    );
  } catch {
    return false;
  }
}

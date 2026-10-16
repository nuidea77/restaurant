import type { UploadFolder } from "@/lib/constants";

export const UPLOAD_URL_PREFIX = "/uploads/";

/** URL нь тухайн хэрэглэгчийн хавтсанд байгаа энгийн файл эсэх: /uploads/<folder>/<user>/<file> */
export function isOwnUploadUrl(url: string, folder: UploadFolder, userId: string) {
  const prefix = `${UPLOAD_URL_PREFIX}${folder}/${userId}/`;
  if (!url.startsWith(prefix)) return false;
  return /^[A-Za-z0-9-]+\.[a-z]+$/.test(url.slice(prefix.length));
}

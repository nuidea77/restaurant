import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/db";
import { isOwnUploadUrl, UPLOAD_URL_PREFIX } from "@/lib/upload-path";
import type { UploadFolder } from "@/lib/constants";

const UPLOAD_ROOT = path.join(DATA_DIR, "uploads");

export const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Файлыг data/uploads/<folder>/<user>/ дотор хадгалж, нийтийн URL буцаана. */
export async function saveUpload(folder: UploadFolder, userId: string, data: Buffer, mimeType: string) {
  const name = `${randomUUID()}.${EXT_BY_MIME[mimeType]}`;
  const dir = path.join(UPLOAD_ROOT, folder, userId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), data);
  return `${UPLOAD_URL_PREFIX}${folder}/${userId}/${name}`;
}

/** URL-ийн замыг data/uploads доторх файлын зам болгоно. Гадагш гарах оролдлогод null. */
export function resolveUploadPath(segments: string[]) {
  const full = path.resolve(UPLOAD_ROOT, ...segments);
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null;
}

export async function readOwnUpload(url: string, folder: UploadFolder, userId: string) {
  if (!isOwnUploadUrl(url, folder, userId)) return null;
  const file = resolveUploadPath(url.slice(UPLOAD_URL_PREFIX.length).split("/"));
  if (!file) return null;
  const mimeType = MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()];
  if (!mimeType) return null;
  return { data: await readFile(file), mimeType };
}

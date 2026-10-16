import { readFile } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, resolveUploadPath } from "@/lib/storage";

/** data/uploads доторх файлыг нийтэд үзүүлнэ (зураг, PDF цэс). */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = resolveUploadPath((await params).path);
  const type = file && MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()];
  if (!file || !type) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

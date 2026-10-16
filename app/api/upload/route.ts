import { NextResponse } from "next/server";
import { currentUserId } from "@/auth";
import { MAX_UPLOAD_BYTES, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/constants";
import { saveUpload } from "@/lib/storage";

/** Цэс болон зургийг локал data/uploads хавтаст хадгална. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "");
  if (!(file instanceof File) || !(folder in UPLOAD_FOLDERS)) {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  }
  if (!(UPLOAD_FOLDERS[folder as UploadFolder] as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Зөвшөөрөгдөөгүй файлын төрөл" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файлын хэмжээ 10MB-аас ихгүй байна" }, { status: 400 });
  }

  const url = await saveUpload(folder as UploadFolder, userId, Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url });
}

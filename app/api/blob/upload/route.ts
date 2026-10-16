import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { verifiedUserId } from "@/lib/guards";
import { MAX_UPLOAD_BYTES, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/constants";

/**
 * Vercel Blob client upload токен олгоно. Файл энэ функцээр дамжихгүй (4.5MB хязгаар),
 * клиент Blob storage руу шууд байршуулна.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Утас баталгаажсан эзэмшигч л файл байршуулна.
        const userId = await verifiedUserId();
        if (!userId) throw new Error("Нэвтэрнэ үү");

        const [folder, owner] = pathname.split("/");
        if (!(folder in UPLOAD_FOLDERS) || owner !== userId || pathname.includes("..")) {
          throw new Error("Хандах эрхгүй зам");
        }
        return {
          allowedContentTypes: [...UPLOAD_FOLDERS[folder as UploadFolder]],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

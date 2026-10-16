import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUserId } from "@/auth";
import { isOwnBlobUrl } from "@/lib/blob";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { sql } from "@/lib/db";
import { getRestaurantByOwner } from "@/lib/queries";
import { extractMenuPackages } from "@/lib/vertex";

// Олон хуудастай PDF-ийг Gemini уншихад хугацаа шаардана.
export const maxDuration = 60;

const Body = z.object({ url: z.string().url() });

const MIME_BY_EXT: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  const { url } = parsed.data;
  if (!isOwnBlobUrl(url, "menus", userId)) return NextResponse.json({ error: "Хандах эрхгүй файл" }, { status: 403 });

  const restaurant = await getRestaurantByOwner(userId);
  if (!restaurant) return NextResponse.json({ error: "Эхлээд рестораны профайлаа үүсгэнэ үү" }, { status: 400 });

  const mimeType = MIME_BY_EXT[new URL(url).pathname.split(".").pop()?.toLowerCase() ?? ""];
  if (!mimeType) return NextResponse.json({ error: "Зөвшөөрөгдөөгүй файлын төрөл" }, { status: 400 });

  const file = await fetch(url);
  if (!file.ok) return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 404 });
  const data = Buffer.from(await file.arrayBuffer());
  if (data.byteLength > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Файл хэт том байна" }, { status: 400 });

  let packages;
  try {
    packages = await extractMenuPackages({ data, mimeType });
  } catch (err) {
    console.error("Vertex AI extraction failed", err);
    return NextResponse.json({ error: "AI цэсийг уншиж чадсангүй. Дахин оролдоно уу." }, { status: 502 });
  }

  if (packages.length === 0) {
    return NextResponse.json({ error: "Цэснээс багц олдсонгүй. Илүү тод файл оруулна уу.", packages: [] }, { status: 422 });
  }

  // Хүний хяналтаар баталгаажтал нийтэд харагдахгүй (is_verified = false).
  const inserted = await sql`
    insert into menu_packages (restaurant_id, package_name, file_url, total_price, person_count, price_per_person, items, is_verified)
    select ${restaurant.id}, p.package_name, ${url}, p.total_price, p.person_count, p.price_per_person, p.items, false
    from jsonb_to_recordset(${JSON.stringify(packages)}::jsonb)
      as p(package_name text, total_price numeric, person_count int, price_per_person numeric, items jsonb)
    returning id`;

  return NextResponse.json({ packages: inserted });
}

import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/auth";
import { refreshVerification } from "@/lib/verification";

/** Клиент 3 секунд тутам дуудна; сервер verify.mn-ээс албан ёсны төлөвийг асууна. */
export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });

  try {
    return NextResponse.json({ status: await refreshVerification(userId, id) });
  } catch (err) {
    console.error("verify.mn status failed", err);
    return NextResponse.json({ status: "PENDING", retry: true });
  }
}

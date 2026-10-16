import { NextResponse, type NextRequest } from "next/server";
import { refreshBySessionId } from "@/lib/verification";
import { sql } from "@/lib/db";

/**
 * verify.mn callback (GET, body/гарын үсэггүй). Үүнийг итгэхгүй — зөвхөн "одоо шалга" дохио:
 * хүлээгдэж буй session-уудыг verify.mn-ээс дахин шалгана. 2xx-г хурдан буцаана.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const work = sessionId
    ? refreshBySessionId(sessionId)
    : sql<{ session_id: string }>`
        select session_id from phone_verifications
        where status = 'PENDING' and expires_at > now() and session_id not like 'demo-%'
        order by created_at desc limit 20`.then((rows) => Promise.all(rows.map((r) => refreshBySessionId(r.session_id))));
  await work.catch((err) => console.error("verify.mn callback check failed", err));
  return NextResponse.json({ ok: true });
}

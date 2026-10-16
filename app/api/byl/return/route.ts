import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/auth";
import { syncBylPayment } from "@/lib/payments";

/** Byl-ийн success_url болон "Төлбөр шалгах" — Byl-ээс төлөвийг асууж баталгаажуулаад буцаана. */
export async function GET(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", request.url));

  const paymentId = request.nextUrl.searchParams.get("payment") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) return NextResponse.redirect(new URL("/dashboard", request.url));

  const result = await syncBylPayment(paymentId, userId).catch((err) => {
    console.error("Byl payment sync failed", err);
    return { status: "error" as const, restaurantId: undefined };
  });

  if (result.status === "paid") {
    return NextResponse.redirect(new URL(`/dashboard/r/${result.restaurantId}?paid=1`, request.url));
  }
  if (result.restaurantId) {
    return NextResponse.redirect(new URL(`/dashboard/r/${result.restaurantId}/pay?status=${result.status}`, request.url));
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyWebhookSignature } from "@/lib/byl";
import { handleCheckoutCompleted } from "@/lib/payments";

/**
 * Byl.mn webhook (https://byl.mn/docs/en/webhook.html).
 * Dashboard → Webhooks дээр https://<домэйн>/api/byl/webhook-г бүртгэж, Signing secret-ийг BYL_WEBHOOK_SECRET-д хийнэ.
 */
export async function POST(request: Request) {
  const secret = process.env.BYL_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook тохируулаагүй" }, { status: 503 });

  // Гарын үсгийг түүхий body дээр шалгана — JSON-ийг задлаад дахин угсарвал таарахгүй.
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("byl-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: { object?: { id?: number; client_reference_id?: string | null; status?: string } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // markPaid нь зөвхөн pending төлбөрийг шинэчилдэг тул давхар ирсэн event аюулгүй.
  if (event.type === "checkout.completed" && event.data?.object?.id) {
    const o = event.data.object;
    const restaurantId = await handleCheckoutCompleted({
      id: Number(o.id),
      client_reference_id: o.client_reference_id ?? null,
      status: o.status ?? "",
    });
    if (restaurantId) revalidatePath("/", "layout");
  }

  return NextResponse.json({ received: true });
}

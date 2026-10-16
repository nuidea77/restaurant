import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Byl.mn API клиент — https://byl.mn/docs/en/api/
 * Шаардлагатай орчны хувьсагч: BYL_TOKEN, BYL_PROJECT_ID; webhook-д BYL_WEBHOOK_SECRET.
 */
// BYL_API_URL нь зөвхөн тест/mock-д; анхдагч нь Byl-ийн production API.
const BASE_URL = process.env.BYL_API_URL || "https://byl.mn/api/v1";

export function bylConfigured() {
  return Boolean(process.env.BYL_TOKEN && process.env.BYL_PROJECT_ID);
}

export type BylCheckout = {
  id: number;
  url: string;
  status: "open" | "pending" | "complete" | "expired";
  client_reference_id: string | null;
  amount_total: number | string;
  expires_at: string | null;
};

class BylError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function bylFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/projects/${process.env.BYL_PROJECT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.BYL_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new BylError(body.message ?? body.error ?? `Byl API алдаа (${res.status})`, res.status);
  return body.data as T;
}

/** Нэг бүтээгдэхүүнтэй (price_data) checkout үүсгэнэ. Хариунд зөвхөн id, url ирнэ. */
export function createCheckout(input: {
  amount: number;
  name: string;
  reference: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return bylFetch<{ id: number; url: string }>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.reference,
      items: [
        {
          price_data: { unit_amount: input.amount, product_data: { name: input.name.slice(0, 255) } },
          quantity: 1,
        },
      ],
    }),
  });
}

export function getCheckout(id: number) {
  return bylFetch<BylCheckout>(`/checkouts/${id}`);
}

/** Webhook-ийн Byl-Signature толгойг түүхий body-оос HMAC-SHA256-аар шалгана. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

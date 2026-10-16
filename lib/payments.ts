import "server-only";
import { randomBytes } from "node:crypto";
import { bylConfigured, createCheckout, getCheckout } from "@/lib/byl";
import { LISTING_FEE } from "@/lib/constants";
import { sql } from "@/lib/db";
import type { Payment } from "@/lib/types";

/**
 * Нийтлэлийн төлбөр.
 * - "byl": BYL_TOKEN, BYL_PROJECT_ID тохируулсан бол Byl.mn checkout-оор төлнө.
 * - "demo": тохируулаагүй бол туршилтын горим — товч дарахад төлөгдсөнд тооцогдоно.
 */
export function paymentProvider(): "byl" | "demo" {
  return bylConfigured() ? "byl" : "demo";
}

function newReference() {
  // Гүйлгээний утгад бичихэд хялбар: SHJ-7F3K9Q
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "SHJ-" + Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join("");
}

type PaymentRow = Payment;

/** Төлөгдөөгүй рестораны идэвхтэй нэхэмжлэхийг буцаана, байхгүй бол үүсгэнэ. */
export async function getOrCreatePendingPayment(restaurantId: string, ownerId: string) {
  const provider = paymentProvider();
  const [existing] = await sql<PaymentRow>`
    select id, restaurant_id, owner_id, amount::float8 as amount, status, provider, reference, created_at, paid_at,
           byl_checkout_id, byl_checkout_url
    from payments
    where restaurant_id = ${restaurantId} and owner_id = ${ownerId} and status = 'pending' and provider = ${provider}
    order by created_at desc limit 1`;
  if (existing) return existing;

  // Өөр горимоор үүссэн хуучин нэхэмжлэхийг цуцална.
  await sql`update payments set status = 'cancelled'
            where restaurant_id = ${restaurantId} and owner_id = ${ownerId} and status = 'pending'`;
  const [created] = await sql<PaymentRow>`
    insert into payments (restaurant_id, owner_id, amount, provider, reference)
    values (${restaurantId}, ${ownerId}, ${LISTING_FEE}, ${provider}, ${newReference()})
    returning id, restaurant_id, owner_id, amount::float8 as amount, status, provider, reference, created_at, paid_at,
              byl_checkout_id, byl_checkout_url`;
  return created;
}

export async function getPaymentForOwner(paymentId: string, ownerId: string) {
  const [p] = await sql<PaymentRow & { restaurant_name: string }>`
    select p.id, p.restaurant_id, p.owner_id, p.amount::float8 as amount, p.status, p.provider, p.reference,
           p.created_at, p.paid_at, p.byl_checkout_id, p.byl_checkout_url, r.name as restaurant_name
    from payments p join restaurants r on r.id = p.restaurant_id
    where p.id = ${paymentId}::uuid and p.owner_id = ${ownerId}`;
  return p ?? null;
}

/** Төлбөрийг төлөгдсөн болгож, рестораныг нийтэд нээнэ. Нэг SQL тул хагас хийгдэхгүй, давтан дуудахад аюулгүй. */
async function markPaid(paymentId: string) {
  const rows = await sql<{ id: string }>`
    with paid as (
      update payments set status = 'paid', paid_at = now()
      where id = ${paymentId}::uuid and status = 'pending'
      returning restaurant_id
    )
    update restaurants r set is_paid = true, paid_at = now()
    from paid where r.id = paid.restaurant_id
    returning r.id`;
  return rows[0]?.id ?? null;
}

/** Туршилтын горимын төлбөр. Byl тохируулсан үед ажиллахгүй. */
export async function confirmDemoPayment(paymentId: string, ownerId: string) {
  if (paymentProvider() !== "demo") return null;
  const p = await getPaymentForOwner(paymentId, ownerId);
  if (!p || p.provider !== "demo") return null;
  return markPaid(p.id);
}

/** Byl checkout үүсгэж (эсвэл өмнөхийг дахин ашиглаж) төлбөрийн хуудасны URL буцаана. */
export async function startBylCheckout(paymentId: string, ownerId: string, origin: string) {
  const p = await getPaymentForOwner(paymentId, ownerId);
  if (!p || p.status !== "pending" || p.provider !== "byl") throw new Error("Нэхэмжлэх олдсонгүй");

  if (p.byl_checkout_id && p.byl_checkout_url) {
    const existing = await getCheckout(p.byl_checkout_id).catch(() => null);
    if (existing?.status === "open" || existing?.status === "pending") return existing.url;
    if (existing?.status === "complete") {
      await markPaid(p.id);
      return `${origin}/dashboard/r/${p.restaurant_id}?paid=1`;
    }
  }

  const checkout = await createCheckout({
    amount: p.amount,
    name: `Ресторан нийтлэх: ${p.restaurant_name}`,
    reference: p.reference,
    successUrl: `${origin}/api/byl/return?payment=${p.id}`,
    cancelUrl: `${origin}/dashboard/r/${p.restaurant_id}/pay`,
  });
  await sql`update payments set byl_checkout_id = ${checkout.id}, byl_checkout_url = ${checkout.url}
            where id = ${p.id}::uuid`;
  return checkout.url;
}

/**
 * Byl-ээс checkout-ийн төлөвийг шууд асууж баталгаажуулна (буцах хуудас, "Шалгах" товч).
 * Webhook localhost руу хүрдэггүй тул локал орчинд энэ нь гол баталгаажуулалт болно.
 */
export async function syncBylPayment(paymentId: string, ownerId: string) {
  const p = await getPaymentForOwner(paymentId, ownerId);
  if (!p) return { status: "missing" as const };
  if (p.status === "paid") return { status: "paid" as const, restaurantId: p.restaurant_id };
  if (!p.byl_checkout_id) return { status: "pending" as const, restaurantId: p.restaurant_id };

  const checkout = await getCheckout(p.byl_checkout_id);
  if (checkout.status === "complete" && checkout.client_reference_id === p.reference) {
    await markPaid(p.id);
    return { status: "paid" as const, restaurantId: p.restaurant_id };
  }
  return { status: checkout.status, restaurantId: p.restaurant_id };
}

/** Webhook-ийн checkout.completed — гарын үсэг шалгагдсаны дараа дуудагдана. */
export async function handleCheckoutCompleted(checkout: { id: number; client_reference_id: string | null; status: string }) {
  if (checkout.status !== "complete") return null;
  const [p] = await sql<{ id: string; reference: string }>`
    select id, reference from payments where byl_checkout_id = ${checkout.id} and provider = 'byl'`;
  if (!p || p.reference !== checkout.client_reference_id) return null;
  return markPaid(p.id);
}

export function getPaidPayment(restaurantId: string, ownerId: string) {
  return sql<Payment>`
    select id, restaurant_id, owner_id, amount::float8 as amount, status, provider, reference, created_at, paid_at
    from payments
    where restaurant_id = ${restaurantId} and owner_id = ${ownerId} and status = 'paid'
    order by paid_at desc limit 1`.then((r) => r[0] ?? null);
}

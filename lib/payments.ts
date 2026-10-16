import "server-only";
import { randomBytes } from "node:crypto";
import { LISTING_FEE } from "@/lib/constants";
import { sql } from "@/lib/db";
import type { Payment } from "@/lib/types";

/**
 * Нийтлэлийн төлбөр. Одоогоор "demo" горим: эзэмшигч товч дарахад төлбөр төлөгдсөнд тооцогдоно.
 * Жинхэнэ төлбөрийн систем (QPay г.м.) холбохдоо confirmPayment-ийг тухайн системийн
 * callback/шалгалтаас дуудна.
 */
export const PAYMENT_PROVIDER = "demo";

function newReference() {
  // Шилжүүлгийн утгад бичихэд хялбар: SHJ-7F3K9Q
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return "SHJ-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Төлөгдөөгүй рестораны хүлээгдэж буй нэхэмжлэхийг буцаана, байхгүй бол үүсгэнэ. */
export async function getOrCreatePendingPayment(restaurantId: string, ownerId: string) {
  const [existing] = await sql<Payment>`
    select id, restaurant_id, owner_id, amount::float8 as amount, status, provider, reference, created_at, paid_at
    from payments
    where restaurant_id = ${restaurantId} and owner_id = ${ownerId} and status = 'pending'
    order by created_at desc limit 1`;
  if (existing) return existing;

  const [created] = await sql<Payment>`
    insert into payments (restaurant_id, owner_id, amount, provider, reference)
    values (${restaurantId}, ${ownerId}, ${LISTING_FEE}, ${PAYMENT_PROVIDER}, ${newReference()})
    returning id, restaurant_id, owner_id, amount::float8 as amount, status, provider, reference, created_at, paid_at`;
  return created;
}

/** Төлбөрийг төлөгдсөн болгож, рестораныг нийтэд нээнэ. Нэг SQL дотор тул хагас хийгдэхгүй. */
export async function confirmPayment(paymentId: string, ownerId: string) {
  const rows = await sql<{ id: string }>`
    with paid as (
      update payments set status = 'paid', paid_at = now()
      where id = ${paymentId}::uuid and owner_id = ${ownerId} and status = 'pending'
      returning restaurant_id
    )
    update restaurants r set is_paid = true, paid_at = now()
    from paid where r.id = paid.restaurant_id
    returning r.id`;
  return rows[0]?.id ?? null;
}

export function getPaidPayment(restaurantId: string, ownerId: string) {
  return sql<Payment>`
    select id, restaurant_id, owner_id, amount::float8 as amount, status, provider, reference, created_at, paid_at
    from payments
    where restaurant_id = ${restaurantId} and owner_id = ${ownerId} and status = 'paid'
    order by paid_at desc limit 1`.then((r) => r[0] ?? null);
}

import "server-only";
import { randomInt } from "node:crypto";
import { sql } from "@/lib/db";
import { createSession, getSessionStatus, verifyMnConfigured } from "@/lib/verifymn";

export type VerificationView = {
  id: string;
  phone: string;
  code: string;
  instruction: string | null;
  sms_uri: string | null;
  status: "PENDING" | "VERIFIED" | "EXPIRED";
  expires_at: string;
};

export function verificationMode(): "verifymn" | "demo" {
  return verifyMnConfigured() ? "verifymn" : "demo";
}

export async function getUserPhoneState(userId: string) {
  const [u] = await sql<{ phone: string | null; phone_verified_at: string | null }>`
    select phone, phone_verified_at from users where id = ${userId}`;
  return u ?? null;
}

export async function isPhoneVerified(userId: string) {
  return Boolean((await getUserPhoneState(userId))?.phone_verified_at);
}

/** Хэрэглэгчийн хамгийн сүүлийн хүчинтэй (хугацаа дуусаагүй) session. */
export async function getActiveVerification(userId: string) {
  const [v] = await sql<VerificationView>`
    select id, phone, code, instruction, sms_uri, status, expires_at
    from phone_verifications
    where user_id = ${userId} and status = 'PENDING' and expires_at > now()
    order by created_at desc limit 1`;
  return v ?? null;
}

/**
 * Шинэ баталгаажуулалт эхлүүлнэ. Код бүр шинэ (давтагдахгүй) 6 оронтой тоо.
 * Хуучин дугааргүй (имэйлээр бүртгүүлсэн) хэрэглэгч энд дугаараа оруулна.
 */
export async function startVerification(userId: string, phone: string, callbackBase?: string) {
  const taken = await sql`select 1 from users where phone = ${phone} and id <> ${userId}`;
  if (taken.length) throw new UserFacingError("Энэ дугаар өөр бүртгэлд холбогдсон байна");

  await sql`update users set phone = ${phone} where id = ${userId} and phone_verified_at is null`;
  await sql`update phone_verifications set status = 'EXPIRED' where user_id = ${userId} and status = 'PENDING'`;

  const code = String(randomInt(100000, 1000000));

  if (verificationMode() === "demo") {
    const [v] = await sql<VerificationView>`
      insert into phone_verifications (user_id, phone, session_id, code, instruction, sms_uri, expires_at)
      values (${userId}, ${phone}, ${"demo-" + crypto.randomUUID()}, ${code},
              ${"Туршилтын горим: SMS илгээх шаардлагагүй."}, ${null}, now() + interval '5 minutes')
      returning id, phone, code, instruction, sms_uri, status, expires_at`;
    return v;
  }

  // Callback нь зөвхөн https нийтийн хаягтай үед; localhost дээр polling-оор шалгана.
  const session = await createSession({
    phone,
    text: code,
    ...(callbackBase?.startsWith("https://") ? { callback: `${callbackBase}/api/verify/callback` } : {}),
  });
  const [v] = await sql<VerificationView>`
    insert into phone_verifications (user_id, phone, session_id, code, instruction, sms_uri, expires_at)
    values (${userId}, ${phone}, ${session.sessionId}, ${session.text}, ${session.displayInstruction},
            ${session.smsUri}, ${session.expiresAt})
    returning id, phone, code, instruction, sms_uri, status, expires_at`;
  return v;
}

async function markVerified(verificationId: string) {
  await sql`
    with v as (
      update phone_verifications set status = 'VERIFIED'
      where id = ${verificationId}::uuid and status = 'PENDING'
      returning user_id, phone
    )
    update users u set phone_verified_at = now()
    from v where u.id = v.user_id and u.phone = v.phone`;
}

/** verify.mn-ээс төлөвийг асууж локал бичлэгийг шинэчилнэ. */
export async function refreshVerification(userId: string, verificationId: string) {
  const [v] = await sql<{ id: string; session_id: string; status: string; expires_at: string }>`
    select id, session_id, status, expires_at from phone_verifications
    where id = ${verificationId}::uuid and user_id = ${userId}`;
  if (!v) return "EXPIRED" as const;
  if (v.status !== "PENDING") return v.status as "VERIFIED" | "EXPIRED";
  if (v.session_id.startsWith("demo-")) return new Date(v.expires_at) < new Date() ? ("EXPIRED" as const) : ("PENDING" as const);

  const remote = await getSessionStatus(v.session_id);
  if (remote.sessionStatus === "VERIFIED") {
    await markVerified(v.id);
    return "VERIFIED" as const;
  }
  if (remote.sessionStatus === "EXPIRED") {
    await sql`update phone_verifications set status = 'EXPIRED' where id = ${v.id}::uuid`;
  }
  return remote.sessionStatus;
}

/** verify.mn callback — гарын үсэггүй тул зөвхөн "одоо шалга" дохио гэж үзнэ. */
export async function refreshBySessionId(sessionId: string) {
  const [v] = await sql<{ id: string; user_id: string }>`
    select id, user_id from phone_verifications where session_id = ${sessionId} and status = 'PENDING'`;
  if (v) await refreshVerification(v.user_id, v.id);
}

/** Туршилтын горимд л ажиллана. */
export async function confirmDemoVerification(userId: string, verificationId: string) {
  if (verificationMode() !== "demo") return false;
  const [v] = await sql<{ id: string }>`
    select id from phone_verifications
    where id = ${verificationId}::uuid and user_id = ${userId} and status = 'PENDING'
      and session_id like 'demo-%' and expires_at > now()`;
  if (!v) return false;
  await markVerified(v.id);
  return true;
}

export class UserFacingError extends Error {}

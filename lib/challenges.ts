import "server-only";
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { sql } from "@/lib/db";
import { UserFacingError, verificationMode } from "@/lib/verification";
import { createSession, getSessionStatus } from "@/lib/verifymn";

/**
 * Нэвтрээгүй хэрэглэгч утасны дугаараараа өөрийгөө батлах (SMS-ээр нэвтрэх, нууц үг сэргээх).
 * Хэрэглэгч бүртгэлтэй дугаараасаа 144773 руу код илгээнэ; verify.mn VERIFIED гэвэл нэг удаа ашиглана.
 */
export type ChallengePurpose = "login" | "reset";

export type ChallengeView = {
  id: string;
  secret: string;
  phone: string;
  code: string;
  instruction: string | null;
  smsUri: string | null;
  expiresAt: string;
};

const MAX_PER_HOUR = 5;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

function secretMatches(secret: string, stored: string) {
  const a = Buffer.from(hash(secret));
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startChallenge(phone: string, purpose: ChallengePurpose, callbackBase?: string): Promise<ChallengeView> {
  const [user] = await sql<{ id: string }>`select id from users where phone = ${phone}`;
  if (!user) throw new UserFacingError("Энэ дугаараар бүртгэл олдсонгүй. Шинээр бүртгүүлнэ үү.");

  const [{ n }] = await sql<{ n: number }>`
    select count(*)::int as n from phone_challenges where phone = ${phone} and created_at > now() - interval '1 hour'`;
  if (n >= MAX_PER_HOUR) throw new UserFacingError("Хэт олон оролдлого хийлээ. 1 цагийн дараа дахин оролдоно уу.");

  // Энэ дугаарын өмнөх хүлээгдэж буй challenge-уудыг хүчингүй болгоно.
  await sql`update phone_challenges set status = 'EXPIRED' where phone = ${phone} and status = 'PENDING'`;

  const code = String(randomInt(100000, 1000000));
  const secret = randomBytes(24).toString("base64url");

  let sessionId = `demo-${randomUUID()}`;
  let instruction: string | null = null;
  let smsUri: string | null = null;
  let expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

  if (verificationMode() === "verifymn") {
    const s = await createSession({
      phone,
      text: code,
      ...(callbackBase?.startsWith("https://") ? { callback: `${callbackBase}/api/verify/callback` } : {}),
    });
    sessionId = s.sessionId;
    instruction = s.displayInstruction;
    smsUri = s.smsUri;
    expiresAt = s.expiresAt;
  }

  const [row] = await sql<{ id: string }>`
    insert into phone_challenges (user_id, phone, purpose, session_id, code, instruction, sms_uri, secret_hash, expires_at)
    values (${user.id}, ${phone}, ${purpose}, ${sessionId}, ${code}, ${instruction}, ${smsUri}, ${hash(secret)}, ${expiresAt})
    returning id`;
  return { id: row.id, secret, phone, code, instruction, smsUri, expiresAt };
}

type Row = { id: string; session_id: string; status: string; expires_at: string; secret_hash: string; consumed_at: string | null };

async function load(id: string, secret: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await sql<Row>`
    select id, session_id, status, expires_at, secret_hash, consumed_at from phone_challenges where id = ${id}::uuid`;
  return row && secretMatches(secret, row.secret_hash) ? row : null;
}

/** verify.mn-ээс төлөвийг шалгана. */
export async function checkChallenge(id: string, secret: string): Promise<"PENDING" | "VERIFIED" | "EXPIRED"> {
  const row = await load(id, secret);
  if (!row || row.consumed_at) return "EXPIRED";
  if (row.status !== "PENDING") return row.status as "VERIFIED" | "EXPIRED";
  if (row.session_id.startsWith("demo-")) return new Date(row.expires_at) < new Date() ? "EXPIRED" : "PENDING";

  const remote = await getSessionStatus(row.session_id);
  if (remote.sessionStatus !== "PENDING") {
    await sql`update phone_challenges set status = ${remote.sessionStatus} where id = ${row.id}::uuid and status = 'PENDING'`;
  }
  return remote.sessionStatus;
}

/** Туршилтын горимд л: SMS-гүйгээр баталгаажуулна. */
export async function confirmDemoChallenge(id: string, secret: string) {
  if (verificationMode() !== "demo") return false;
  const row = await load(id, secret);
  if (!row || !row.session_id.startsWith("demo-") || row.status !== "PENDING") return false;
  await sql`update phone_challenges set status = 'VERIFIED' where id = ${row.id}::uuid`;
  return true;
}

/**
 * Баталгаажсан challenge-ийг нэг удаа ашиглаж хэрэглэгчийн id-г буцаана (SMS-ийн хугацаанаас хойш 10 мин дотор).
 * Утасны эзэмшлийг баталсан тул утас баталгаажаагүй байсан бол баталгаажуулна.
 */
export async function consumeChallenge(id: string, secret: string, purpose: ChallengePurpose) {
  const row = await load(id, secret);
  if (!row) return null;
  const [used] = await sql<{ user_id: string }>`
    update phone_challenges set consumed_at = now()
    where id = ${row.id}::uuid and purpose = ${purpose} and status = 'VERIFIED' and consumed_at is null
      and now() < expires_at + interval '10 minutes'
    returning user_id`;
  if (!used) return null;
  await sql`update users set phone_verified_at = coalesce(phone_verified_at, now()) where id = ${used.user_id}`;
  return used.user_id;
}

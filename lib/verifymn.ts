import "server-only";

/**
 * verify.mn — Монголын MO SMS баталгаажуулалт (https://verify.mn).
 * Хэрэглэгч өөрийн дугаараас 144773 руу кодыг SMS-ээр илгээнэ; бид GET /sessions/:id-ээр VERIFIED эсэхийг шалгана.
 */
// VERIFY_MN_API_URL нь зөвхөн тест/mock-д.
const BASE_URL = process.env.VERIFY_MN_API_URL || "https://api.verify.mn";

export function verifyMnConfigured() {
  return Boolean(process.env.VERIFY_MN_API_KEY);
}

export type VerifySession = {
  sessionId: string;
  phone: string;
  shortcode: string;
  text: string;
  smsUri: string;
  displayInstruction: string;
  expiresAt: string;
};

export type VerifySessionStatus = {
  sessionId: string;
  sessionStatus: "PENDING" | "VERIFIED" | "EXPIRED";
  verifiedAt: string | null;
  expiresAt: string;
};

export class VerifyMnError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function createSession(input: { phone: string; text: string; callback?: string }) {
  const key = process.env.VERIFY_MN_API_KEY;
  if (!key) throw new Error("VERIFY_MN_API_KEY тохируулаагүй байна");
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new VerifyMnError(body.message ?? `verify.mn алдаа (${res.status})`, res.status);
  return body as VerifySession;
}

/** Албан ёсны төлөв. Callback ирсэн ч үүгээр давхар шалгана. */
export async function getSessionStatus(sessionId: string) {
  const res = await fetch(`${BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new VerifyMnError(body.message ?? `verify.mn алдаа (${res.status})`, res.status);
  return body as VerifySessionStatus;
}

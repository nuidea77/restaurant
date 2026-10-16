"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { checkChallenge, confirmDemoChallenge, consumeChallenge, startChallenge, type ChallengePurpose, type ChallengeView } from "@/lib/challenges";
import { sql } from "@/lib/db";
import { appOrigin } from "@/lib/origin";
import { normalizePhone } from "@/lib/phone";
import { UserFacingError } from "@/lib/verification";
import { VerifyMnError } from "@/lib/verifymn";

export type StartChallengeResult = { ok: true; challenge: ChallengeView } | { ok: false; error: string };

export async function startSmsChallenge(rawPhone: string, purpose: ChallengePurpose): Promise<StartChallengeResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Утасны дугаар буруу байна (8 оронтой)" };
  try {
    return { ok: true, challenge: await startChallenge(phone, purpose, await appOrigin()) };
  } catch (err) {
    if (err instanceof UserFacingError) return { ok: false, error: err.message };
    if (err instanceof VerifyMnError && err.status === 409) {
      return { ok: false, error: "Энэ дугаарт идэвхтэй баталгаажуулалт байна. Түр хүлээгээд дахин оролдоно уу." };
    }
    console.error("verify.mn challenge failed", err);
    return { ok: false, error: "Баталгаажуулалт эхлүүлж чадсангүй. Түр хүлээгээд дахин оролдоно уу." };
  }
}

export async function checkSmsChallenge(id: string, secret: string) {
  try {
    return await checkChallenge(id, secret);
  } catch (err) {
    console.error("verify.mn status failed", err);
    return "PENDING" as const;
  }
}

export async function confirmDemoSmsChallenge(id: string, secret: string) {
  return confirmDemoChallenge(id, secret);
}

/** SMS-ээр нэвтрэх: баталгаажсан challenge-ээр нууц үггүй нэвтэрнэ. */
export async function smsLogin(id: string, secret: string) {
  try {
    await signIn("sms", { challengeId: id, secret, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Нэвтрэх хугацаа дууссан. Дахин оролдоно уу." };
    throw err; // амжилттай үед redirect шиднэ
  }
  return null;
}

const NewPassword = z
  .object({ password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт"), password_confirm: z.string() })
  .refine((d) => d.password === d.password_confirm, { message: "Нууц үг таарахгүй байна" });

/** Нууц үг сэргээх: баталгаажсан challenge-ээр шинэ нууц үг тохируулаад нэвтэрнэ. */
export async function resetPassword(id: string, secret: string, password: string, passwordConfirm: string) {
  const parsed = NewPassword.safeParse({ password, password_confirm: passwordConfirm });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const userId = await consumeChallenge(id, secret, "reset");
  if (!userId) return { error: "Баталгаажуулалтын хугацаа дууссан. Дахин эхлүүлнэ үү." };

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const [user] = await sql<{ phone: string }>`
    update users set password_hash = ${hash} where id = ${userId} returning phone`;

  try {
    await signIn("credentials", { login: user.phone, password: parsed.data.password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Нууц үг солигдсон. Шинэ нууц үгээрээ нэвтэрнэ үү." };
    throw err;
  }
  return null;
}

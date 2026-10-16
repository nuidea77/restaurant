"use server";

import { currentUserId } from "@/auth";
import { appOrigin } from "@/lib/origin";
import { normalizePhone } from "@/lib/phone";
import {
  confirmDemoVerification,
  startVerification,
  UserFacingError,
  type VerificationView,
} from "@/lib/verification";
import { VerifyMnError } from "@/lib/verifymn";

export type StartResult = { ok: true; verification: VerificationView } | { ok: false; error: string };

export async function startPhoneVerification(rawPhone: string): Promise<StartResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Нэвтэрнэ үү" };
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "Утасны дугаар буруу байна (8 оронтой)" };

  try {
    const verification = await startVerification(userId, phone, await appOrigin());
    return { ok: true, verification };
  } catch (err) {
    if (err instanceof UserFacingError) return { ok: false, error: err.message };
    if (err instanceof VerifyMnError && err.status === 409) {
      return { ok: false, error: "Энэ дугаарт идэвхтэй баталгаажуулалт байна. Түр хүлээгээд дахин оролдоно уу." };
    }
    console.error("verify.mn session failed", err);
    return { ok: false, error: "Баталгаажуулалт эхлүүлж чадсангүй. Түр хүлээгээд дахин оролдоно уу." };
  }
}

export async function confirmDemo(verificationId: string) {
  const userId = await currentUserId();
  if (!userId) return false;
  return confirmDemoVerification(userId, verificationId);
}

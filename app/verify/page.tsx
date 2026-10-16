import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { VerifyPhone } from "@/components/verify-phone";
import { Section } from "@/components/ui/frame";
import { appOrigin } from "@/lib/origin";
import {
  getActiveVerification,
  getUserPhoneState,
  startVerification,
  UserFacingError,
  verificationMode,
} from "@/lib/verification";

export default async function VerifyPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const state = await getUserPhoneState(userId);
  if (state?.phone_verified_at) redirect("/dashboard");

  // Бүртгүүлсэн дугаарт зориулсан кодыг урьдчилан бэлдэнэ — хэрэглэгч дугаар оруулах, товч дарах шаардлагагүй.
  let verification = await getActiveVerification(userId);
  let initialError: string | null = null;
  if (!verification && state?.phone) {
    try {
      verification = await startVerification(userId, state.phone, await appOrigin());
    } catch (err) {
      console.error("verify.mn session failed", err);
      initialError =
        err instanceof UserFacingError ? err.message : "Баталгаажуулах код бэлдэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.";
    }
  }

  return (
    <Section className="hero-glow flex min-h-[70vh] items-center justify-center py-16">
      <VerifyPhone
        registeredPhone={state?.phone ?? null}
        initialVerification={verification}
        initialError={initialError}
        mode={verificationMode()}
      />
    </Section>
  );
}

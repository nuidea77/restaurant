import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { VerifyPhone } from "@/components/verify-phone";
import { Section } from "@/components/ui/frame";
import { getActiveVerification, getUserPhoneState, verificationMode } from "@/lib/verification";

export default async function VerifyPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const state = await getUserPhoneState(userId);
  if (state?.phone_verified_at) redirect("/dashboard");

  return (
    <Section className="hero-glow flex min-h-[70vh] items-center justify-center py-16">
      <VerifyPhone
        initialPhone={state?.phone ?? ""}
        initialVerification={await getActiveVerification(userId)}
        mode={verificationMode()}
      />
    </Section>
  );
}

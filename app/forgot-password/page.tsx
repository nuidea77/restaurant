import { ForgotPassword } from "@/components/forgot-password";
import { verificationMode } from "@/lib/verification";

export const metadata = { title: "Нууц үг сэргээх" };

export default function ForgotPasswordPage() {
  return <ForgotPassword verifyMode={verificationMode()} />;
}

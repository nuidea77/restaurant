import { LoginForm } from "@/components/login-form";
import { verificationMode } from "@/lib/verification";

export default function LoginPage() {
  return <LoginForm verifyMode={verificationMode()} />;
}

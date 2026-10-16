import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { isPhoneVerified } from "@/lib/verification";

/** Самбарын бүх хуудас: нэвтэрсэн + утас баталгаажсан байх ёстой. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  if (!(await isPhoneVerified(userId))) redirect("/verify");
  return children;
}

import "server-only";
import { currentUserId } from "@/auth";
import { isPhoneVerified } from "@/lib/verification";

/** Нэвтэрсэн бөгөөд утсаа баталгаажуулсан хэрэглэгчийн id, эс бөгөөс null. */
export async function verifiedUserId() {
  const userId = await currentUserId();
  if (!userId) return null;
  return (await isPhoneVerified(userId)) ? userId : null;
}

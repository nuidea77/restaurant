import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sql } from "@/lib/db";
import { authSecret } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// login: утасны дугаар (үндсэн) эсвэл хуучин бүртгэлийн имэйл.
const Credentials_ = z.object({ login: z.string().min(1), password: z.string().min(8) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel болон `next start` дээр Host header-ийг итгэмжлэнэ (UntrustedHost алдаанаас сэргийлнэ).
  trustHost: true,
  secret: authSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { login: {}, password: {} },
      async authorize(raw) {
        const parsed = Credentials_.safeParse(raw);
        if (!parsed.success) return null;
        const login = parsed.data.login.trim();
        const phone = login.includes("@") ? null : normalizePhone(login);
        if (!phone && !login.includes("@")) return null;
        const [user] = phone
          ? await sql<{ id: string; password_hash: string }>`select id, password_hash from users where phone = ${phone}`
          : await sql<{ id: string; password_hash: string }>`
              select id, password_hash from users where email = ${login.toLowerCase()}`;
        if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return null;
        return { id: user.id };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

/** Нэвтэрсэн хэрэглэгчийн id, эсвэл null. */
export async function currentUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

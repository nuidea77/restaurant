"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { sql } from "@/lib/db";

export type AuthState = { error: string } | null;

const Body = z.object({
  email: z.email("Имэйл буруу байна"),
  password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт"),
});

export async function authenticate(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Body.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data.email.toLowerCase();

  if (form.get("mode") === "signup") {
    const hash = await bcrypt.hash(parsed.data.password, 10);
    const rows = await sql`
      insert into users (email, password_hash) values (${email}, ${hash})
      on conflict (email) do nothing returning id`;
    if (rows.length === 0) return { error: "Энэ имэйлээр бүртгэл үүссэн байна" };
  }

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Имэйл эсвэл нууц үг буруу байна" };
    throw err; // амжилттай үед redirect шиднэ
  }
  return null;
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

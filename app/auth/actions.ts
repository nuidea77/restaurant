"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { sql } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

export type AuthState = { error: string; login?: string } | null;

const SignIn = z.object({
  login: z.string().trim().min(1, "Утасны дугаараа оруулна уу"),
  password: z.string().min(1, "Нууц үгээ оруулна уу"),
});

const SignUp = z
  .object({
    phone: z.string().transform((v, ctx) => {
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "Утасны дугаар буруу байна (8 оронтой)" });
        return z.NEVER;
      }
      return phone;
    }),
    password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, { message: "Нууц үг таарахгүй байна", path: ["password_confirm"] });

export async function authenticate(_prev: AuthState, form: FormData): Promise<AuthState> {
  const isSignup = form.get("mode") === "signup";
  let login: string;
  let password: string;

  if (isSignup) {
    const parsed = SignUp.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message, login: String(form.get("phone") ?? "") };
    const hash = await bcrypt.hash(parsed.data.password, 10);
    const rows = await sql`
      insert into users (phone, password_hash) values (${parsed.data.phone}, ${hash})
      on conflict (phone) where phone is not null do nothing returning id`;
    if (rows.length === 0) return { error: "Энэ дугаараар бүртгэл үүссэн байна. Нэвтэрнэ үү.", login: parsed.data.phone };
    login = parsed.data.phone;
    password = parsed.data.password;
  } else {
    const parsed = SignIn.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    login = parsed.data.login;
    password = parsed.data.password;
  }

  try {
    // Шинэ бүртгэл шууд утас баталгаажуулах руу; нэвтрэлт самбар руу (баталгаажаагүй бол тэндээс /verify руу).
    await signIn("credentials", { login, password, redirectTo: isSignup ? "/verify" : "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Утасны дугаар эсвэл нууц үг буруу байна", login };
    throw err; // амжилттай үед redirect шиднэ
  }
  return null;
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

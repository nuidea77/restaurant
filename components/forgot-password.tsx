"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { resetPassword } from "@/app/auth/sms-actions";
import { Logo } from "@/components/logo";
import { SmsChallenge } from "@/components/sms-challenge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Нууц үг сэргээх: утсаа verify.mn-ээр батлаад шинэ нууц үгээ 2 удаа оруулна. */
export function ForgotPassword({ verifyMode }: { verifyMode: "verifymn" | "demo" }) {
  const [verified, setVerified] = useState<{ id: string; secret: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className="hero-glow flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm shadow-xl shadow-black/5">
        <CardHeader className="items-center pt-8 text-center">
          <Logo />
          <CardTitle className="mt-4 text-xl">Нууц үг сэргээх</CardTitle>
          <p className="text-sm text-muted-foreground">
            {verified ? "Шинэ нууц үгээ оруулна уу." : "Бүртгэлтэй утсаараа SMS илгээж өөрийгөө баталгаажуулна."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          {!verified ? (
            <SmsChallenge
              purpose="reset"
              mode={verifyMode}
              submitLabel="Үргэлжлүүлэх"
              onVerified={(id, secret) => setVerified({ id, secret })}
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  const res = await resetPassword(verified.id, verified.secret, password, confirm);
                  if (res?.error) setError(res.error);
                });
              }}
            >
              <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4" /> Утас баталгаажлаа
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-password">Шинэ нууц үг</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password-confirm">Шинэ нууц үг давтах</Label>
                <Input
                  id="new-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  aria-invalid={mismatch || undefined}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {mismatch ? (
                  <p className="text-sm text-destructive">Нууц үг таарахгүй байна</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Хамгийн багадаа 8 тэмдэгт.</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={pending || mismatch || password.length < 8}>
                <KeyRound className="h-4 w-4" /> {pending ? "Хадгалж байна..." : "Нууц үг солих"}
              </Button>
            </form>
          )}
          <Link href="/login" className="block text-center text-sm text-muted-foreground underline">
            Нэвтрэх хуудас руу буцах
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

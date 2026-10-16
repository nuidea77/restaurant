"use client";

import { useActionState, useState } from "react";
import { authenticate } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(authenticate, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = mode === "signup" && confirm.length > 0 && password !== confirm;

  return (
    <div className="hero-glow flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm shadow-xl shadow-black/5">
        <CardHeader className="items-center pt-8 text-center">
          <Logo />
          <CardTitle className="mt-4 text-xl">{mode === "signin" ? "Ресторан эзэмшигч нэвтрэх" : "Ресторан бүртгүүлэх"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "signin"
              ? "Цэс, багцаа удирдахын тулд нэвтэрнэ үү."
              : "Утасны дугаараараа бүртгүүлээд SMS-ээр баталгаажуулна."}
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          {/* key: горим солигдоход талбаруудыг цэвэрлэнэ */}
          <form key={mode} action={action} className="space-y-4">
            <input type="hidden" name="mode" value={mode} />
            <div className="space-y-2">
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input
                id="phone"
                name={mode === "signup" ? "phone" : "login"}
                type="tel"
                inputMode="numeric"
                required
                autoComplete="tel"
                placeholder="9911 2233"
                defaultValue={state?.login ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Нууц үг давтах</Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-invalid={mismatch || undefined}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {mismatch ? (
                  <p className="text-sm text-destructive">Нууц үг таарахгүй байна</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Хамгийн багадаа 8 тэмдэгт.</p>
                )}
              </div>
            )}
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending || mismatch}>
              {pending ? "Түр хүлээнэ үү..." : mode === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setPassword("");
                setConfirm("");
              }}
            >
              {mode === "signin" ? "Шинээр бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

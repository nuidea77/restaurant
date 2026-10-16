"use client";

import { useActionState, useState } from "react";
import { authenticate } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(authenticate, null);

  return (
    <div className="hero-glow flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm shadow-xl shadow-black/5">
        <CardHeader className="items-center pt-8 text-center">
          <Logo />
          <CardTitle className="mt-4 text-xl">{mode === "signin" ? "Ресторан эзэмшигч нэвтрэх" : "Ресторан бүртгүүлэх"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Цэс, багцаа удирдахын тулд нэвтэрнэ үү." : "Рестораныхаа Шинэ жилийн цэсийг нийтлээрэй."}
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <form action={action} className="space-y-4">
            <input type="hidden" name="mode" value={mode} />
            <div className="space-y-2">
              <Label htmlFor="email">Имэйл</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Түр хүлээнэ үү..." : mode === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Шинээр бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

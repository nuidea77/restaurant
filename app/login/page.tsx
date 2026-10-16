"use client";

import { useActionState, useState } from "react";
import { authenticate } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState(authenticate, null);

  return (
    <div className="mx-auto max-w-sm py-10">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Ресторан эзэмшигч нэвтрэх" : "Ресторан бүртгүүлэх"}</CardTitle>
        </CardHeader>
        <CardContent>
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

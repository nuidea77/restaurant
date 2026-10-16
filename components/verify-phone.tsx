"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquareText, Smartphone } from "lucide-react";
import { confirmDemo, startPhoneVerification } from "@/app/verify/actions";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/phone";
import type { VerificationView } from "@/lib/verification";

const SHORTCODE = "144773";
const POLL_MS = 3000; // verify.mn: 3 секундээс хурдан шалгах шаардлагагүй

export function VerifyPhone({
  initialPhone,
  initialVerification,
  mode,
}: {
  initialPhone: string;
  initialVerification: VerificationView | null;
  mode: "verifymn" | "demo";
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [verification, setVerification] = useState(initialVerification);
  const [status, setStatus] = useState<"PENDING" | "VERIFIED" | "EXPIRED" | null>(initialVerification ? "PENDING" : null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pending, startTransition] = useTransition();

  const done = useCallback(() => {
    setStatus("VERIFIED");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }, [router]);

  // Хугацаа тоолох
  useEffect(() => {
    if (!verification || status !== "PENDING") return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(verification.expires_at).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [verification, status]);

  // Төлөв шалгах (verify.mn горимд)
  useEffect(() => {
    if (!verification || status !== "PENDING" || mode !== "verifymn") return;
    let stopped = false;
    const poll = async () => {
      const res = await fetch(`/api/verify/status?id=${verification.id}`, { cache: "no-store" }).catch(() => null);
      const body = await res?.json().catch(() => null);
      if (stopped || !body) return;
      if (body.status === "VERIFIED") done();
      else if (body.status === "EXPIRED") setStatus("EXPIRED");
    };
    const t = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [verification, status, mode, done]);

  useEffect(() => {
    if (status === "PENDING" && verification && secondsLeft === 0 && new Date(verification.expires_at) < new Date()) {
      setStatus("EXPIRED");
    }
  }, [secondsLeft, status, verification]);

  function start() {
    setError(null);
    startTransition(async () => {
      const res = await startPhoneVerification(phone);
      if (!res.ok) return setError(res.error);
      setVerification(res.verification);
      setStatus("PENDING");
    });
  }

  if (status === "VERIFIED") {
    return (
      <Card className="w-full max-w-md p-8 text-center shadow-xl shadow-black/5">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-xl font-semibold">Утас баталгаажлаа</h1>
        <p className="mt-1 text-sm text-muted-foreground">Самбар руу шилжиж байна...</p>
      </Card>
    );
  }

  const active = verification && status === "PENDING";
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Card className="w-full max-w-md overflow-hidden shadow-xl shadow-black/5">
      <CardBar icon={<Smartphone />} title="Бүртгэл баталгаажуулах" count={active ? `${minutes}:${seconds}` : undefined} />
      <div className="space-y-5 p-6">
        {!active ? (
          <>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Утасны дугаараа баталгаажуулна уу</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Та өөрийн утаснаас {SHORTCODE} дугаарт богино код илгээж баталгаажуулна. SMS-ийн төлбөр 150₮.
              </p>
            </div>
            {status === "EXPIRED" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Хугацаа дууссан тул өмнөх код хүчингүй боллоо. Шинэ код авна уу.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="verify-phone">Утасны дугаар</Label>
              <Input
                id="verify-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9911 2233"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="lg" className="w-full" onClick={start} disabled={pending || !phone}>
              {pending ? "Түр хүлээнэ үү..." : status === "EXPIRED" ? "Шинэ код авах" : "Баталгаажуулах код авах"}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-xl border bg-accent p-5 text-center">
              <p className="text-sm text-muted-foreground">
                {formatPhone(verification.phone)} дугаараас <b className="text-foreground">{SHORTCODE}</b> руу илгээх код
              </p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em]">{verification.code}</p>
            </div>
            {/* verify.mn-ийн зааврыг үгчлэн харуулна — аль дугаараас илгээхийг заадаг. */}
            {verification.instruction && <p className="text-sm">{verification.instruction}</p>}
            {mode === "verifymn" ? (
              <>
                {verification.sms_uri && (
                  <a href={verification.sms_uri} className={buttonVariants({ size: "lg", className: "w-full" })}>
                    <MessageSquareText className="h-4 w-4" /> SMS илгээх
                  </a>
                )}
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> SMS хүлээж байна...
                </p>
              </>
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    if (await confirmDemo(verification.id)) done();
                    else setError("Баталгаажуулж чадсангүй");
                  })
                }
              >
                Баталгаажуулах (туршилтын горим)
              </Button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => {
                setVerification(null);
                setStatus(null);
              }}
            >
              Өөр дугаар оруулах
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

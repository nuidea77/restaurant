"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { checkSmsChallenge, confirmDemoSmsChallenge, startSmsChallenge } from "@/app/auth/sms-actions";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/phone";
import type { ChallengeView } from "@/lib/challenges";

const SHORTCODE = "144773";
const POLL_MS = 3000;

/**
 * Утасны дугаараа оруулаад бүртгэлтэй дугаараасаа 144773 руу код илгээж батлах (verify.mn).
 * Баталгаажмагц onVerified(id, secret) дуудагдана.
 */
export function SmsChallenge({
  purpose,
  mode,
  submitLabel,
  onVerified,
}: {
  purpose: "login" | "reset";
  mode: "verifymn" | "demo";
  submitLabel: string;
  onVerified: (id: string, secret: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState<ChallengeView | null>(null);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);

  const handle = useCallback(
    (status: string) => {
      if (!challenge) return;
      if (status === "VERIFIED") onVerified(challenge.id, challenge.secret);
      else if (status === "EXPIRED") {
        setExpired(true);
        setChallenge(null);
      }
    },
    [challenge, onVerified],
  );

  useEffect(() => {
    if (!challenge) return;
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) handle("EXPIRED");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [challenge, handle]);

  useEffect(() => {
    if (!challenge || mode !== "verifymn") return;
    let stopped = false;
    const t = setInterval(async () => {
      const status = await checkSmsChallenge(challenge.id, challenge.secret).catch(() => "PENDING");
      if (!stopped) handle(status);
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [challenge, mode, handle]);

  function start() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await startSmsChallenge(phone, purpose);
      if (!res.ok) return setError(res.error);
      setExpired(false);
      setChallenge(res.challenge);
    });
  }

  async function checkNow() {
    if (!challenge) return;
    setChecking(true);
    setInfo(null);
    const status = await checkSmsChallenge(challenge.id, challenge.secret).catch(() => "PENDING");
    setChecking(false);
    if (status === "PENDING") setInfo("SMS хараахан ирээгүй байна. Илгээсэн бол хэдэн секунд хүлээгээд дахин шалгана уу.");
    handle(status);
  }

  if (!challenge) {
    return (
      <div className="space-y-4">
        {expired && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Хугацаа дууссан тул өмнөх код хүчингүй боллоо. Дахин оролдоно уу.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="sms-phone">Бүртгэлтэй утасны дугаар</Label>
          <Input
            id="sms-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9911 2233"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                start();
              }
            }}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="button" className="w-full" size="lg" onClick={start} disabled={pending || !phone}>
          {pending ? "Түр хүлээнэ үү..." : submitLabel}
        </Button>
        <p className="text-xs text-muted-foreground">
          Та бүртгэлтэй дугаараасаа {SHORTCODE} руу богино код илгээж баталгаажуулна. SMS-ийн төлбөр 150₮.
        </p>
      </div>
    );
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const instruction =
    challenge.instruction && mode === "verifymn"
      ? challenge.instruction
      : `Та өөрийн ${challenge.phone} дугаараас ${SHORTCODE} дугаарт "${challenge.code}" гэж SMS илгээнэ үү.`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <b className="text-foreground">{formatPhone(challenge.phone)}</b> дугаараасаа доорх кодыг {SHORTCODE} руу илгээнэ үү.
      </p>
      <div className="space-y-4 rounded-xl border border-primary/25 bg-brand-soft p-4">
        <p className="text-[15px] leading-relaxed">
          <Instruction text={instruction} code={challenge.code} />
        </p>
        {mode === "verifymn" && challenge.smsUri && (
          <a
            href={challenge.smsUri}
            className={buttonVariants({ variant: "outline", size: "lg", className: "w-full border-primary/50 text-primary" })}
          >
            <Send className="h-4 w-4" /> SMS апп нээх
          </a>
        )}
        <p className="text-xs text-muted-foreground">
          SMS-ийн төлбөр: <b className="text-foreground">150₮</b> (үүрэн оператор тооцно).
        </p>
      </div>
      <div className="space-y-1 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> SMS хүлээж байна...
        </p>
        <p className="font-mono text-sm font-semibold tabular-nums">
          {minutes}:{seconds}
        </p>
      </div>
      {mode === "verifymn" ? (
        <Button type="button" variant="dark" size="lg" className="w-full" disabled={checking} onClick={checkNow}>
          {checking ? "Шалгаж байна..." : "Мессеж шалгах"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="dark"
          size="lg"
          className="w-full"
          onClick={async () => {
            if (await confirmDemoSmsChallenge(challenge.id, challenge.secret)) handle("VERIFIED");
          }}
        >
          Баталгаажуулах (туршилтын горим)
        </Button>
      )}
      {info && <p className="text-center text-sm text-muted-foreground">{info}</p>}
      <button
        type="button"
        className="w-full text-sm text-muted-foreground underline"
        onClick={() => {
          setChallenge(null);
          setInfo(null);
        }}
      >
        Өөр дугаар оруулах
      </button>
    </div>
  );
}

/** Зааврын текст дэх кодыг тодруулна. */
export function Instruction({ text, code }: { text: string; code: string }) {
  const quoted = `"${code}"`;
  const i = text.indexOf(quoted);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b className="font-bold">{quoted}</b>
      {text.slice(i + quoted.length)}
    </>
  );
}

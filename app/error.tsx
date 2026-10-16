"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Алдаа гарлаа</h1>
      <p className="text-muted-foreground">
        Хуудсыг ачаалж чадсангүй. Түр хүлээгээд дахин оролдоно уу. Асуудал давтагдвал өгөгдлийн сангийн схем
        үүссэн эсэхийг шалгана уу.
      </p>
      <Button onClick={reset}>Дахин оролдох</Button>
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

/** Хоёр талдаа нимгэн шугамтай гол багана — хуудасны бүх хэсэг үүн дотор байрлана. */
export function Frame({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-6xl overflow-x-clip border-x bg-background/60", className)} {...props} />;
}

/** Хэсэг хоорондын хэвтээ шугам, булан бүрт "+" тэмдэгтэй. */
export function Divider() {
  return (
    <div className="relative h-px bg-border" aria-hidden>
      <Plus className="-left-[5px]" />
      <Plus className="-right-[5px]" />
    </div>
  );
}

function Plus({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 10 10" className={cn("absolute -top-[5px] h-[10px] w-[10px] text-muted-foreground/60", className)}>
      <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("px-4 py-10 sm:px-8", className)} {...props} />;
}

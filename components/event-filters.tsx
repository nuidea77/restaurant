"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { VenueIcon } from "@/components/venue-icon";
import { EVENT_PRICE_CAPS, VENUE_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { formatMNT } from "@/lib/utils";

export type EventFilterValues = { date?: string; type?: string; max?: number };

/** Эвентийн шүүлтүүр: утга өөрчлөгдөхөд URL-ийг шинэчилж шууд хайна. */
export function EventFilters({ initial }: { initial: EventFilterValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function apply() {
    if (!formRef.current) return;
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(formRef.current)) if (v) params.set(k, String(v));
    const q = params.toString();
    startTransition(() => router.replace(q ? `/events?${q}` : "/events", { scroll: false }));
  }

  const chip =
    "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-brand-soft has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

  return (
    <form
      ref={formRef}
      method="get"
      action="/events"
      onChange={apply}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-3 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-52">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="date" type="date" min={todayISO()} defaultValue={initial.date ?? ""} className="py-2 pl-9" aria-label="Өдөр" />
        </div>
        <Select name="max" defaultValue={initial.max ? String(initial.max) : ""} className="w-full py-2 sm:w-52" aria-label="1 хүний үнэ">
          <option value="">1 хүний үнэ — хамаагүй</option>
          {EVENT_PRICE_CAPS.map((c) => (
            <option key={c} value={c}>
              {formatMNT(c)} хүртэл
            </option>
          ))}
        </Select>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Link href="/events" scroll={false} className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Цэвэрлэх
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={chip}>
          <input type="radio" name="type" value="" defaultChecked={!initial.type} className="sr-only" />
          Бүх газар
        </label>
        {VENUE_TYPES.map((v) => (
          <label key={v.key} className={chip}>
            <input type="radio" name="type" value={v.key} defaultChecked={initial.type === v.key} className="sr-only" />
            <VenueIcon type={v.key} className="h-3.5 w-3.5" /> {v.plural}
          </label>
        ))}
      </div>
    </form>
  );
}

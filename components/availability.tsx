"use client";

import { useState } from "react";
import { CalendarCheck, Phone } from "lucide-react";
import { DateCalendar } from "@/components/date-calendar";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDayMN, todayISO } from "@/lib/dates";

/** Нийтийн хуудас: захиалга авах өдрүүдийг хуанлиар харуулж, сонгосон өдрөөр залгахыг санал болгоно. */
export function Availability({ dates, phone, initialDate }: { dates: string[]; phone: string; initialDate?: string }) {
  const today = todayISO();
  const upcoming = dates.filter((d) => d >= today);
  const marked = new Set(upcoming);
  const start = (initialDate && marked.has(initialDate) ? initialDate : upcoming[0]) ?? today;
  const [month, setMonth] = useState({ y: Number(start.slice(0, 4)), m: Number(start.slice(5, 7)) - 1 });
  const [active, setActive] = useState<string | null>(initialDate && marked.has(initialDate) ? initialDate : null);

  if (!upcoming.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Захиалга авах өдрүүдээ ресторан хараахан оруулаагүй байна. Сул өдрийг утсаар лавлана уу.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
      <DateCalendar month={month} onMonthChange={setMonth} marked={marked} active={active} onDayClick={setActive} markedOnly />
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-primary" /> Захиалга авна
          </span>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <span className="h-4 w-4 rounded border bg-card" /> Боломжгүй
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Нийт <span className="font-semibold text-foreground">{upcoming.length}</span> өдөр захиалга авах боломжтой.
          Өдрөө сонгоод ресторантай холбогдоно уу.
        </p>
        {active ? (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-brand-soft p-4">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarCheck className="h-5 w-5 text-primary" /> {formatDayMN(active, true)} — захиалга авна
            </p>
            <a href={`tel:${phone.replace(/\s/g, "")}`} className={buttonVariants({ className: "w-full sm:w-auto" })}>
              <Phone className="h-4 w-4" /> Энэ өдрөөр захиалах ({phone})
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {upcoming.slice(0, 8).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setActive(d);
                  setMonth({ y: Number(d.slice(0, 4)), m: Number(d.slice(5, 7)) - 1 });
                }}
                className="rounded-full border bg-card px-3 py-1 text-sm hover:border-primary hover:text-primary"
              >
                {formatDayMN(d, true)}
              </button>
            ))}
            {upcoming.length > 8 && <span className="px-2 py-1 text-sm text-muted-foreground">+{upcoming.length - 8}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

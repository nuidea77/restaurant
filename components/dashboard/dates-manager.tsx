"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { setAvailableDates } from "@/app/dashboard/actions";
import { DateCalendar } from "@/components/date-calendar";
import { Button } from "@/components/ui/button";
import { formatDayMN, monthCells, todayISO } from "@/lib/dates";

function initialMonth(dates: string[]) {
  const first = dates.find((d) => d >= todayISO()) ?? todayISO();
  return { y: Number(first.slice(0, 4)), m: Number(first.slice(5, 7)) - 1 };
}

/** Эзэмшигч хуанлиас захиалга авах өдрүүдээ сонгоно. */
export function DatesManager({ restaurantId, dates }: { restaurantId: string; dates: string[] }) {
  const [selected, setSelected] = useState(() => new Set(dates));
  const [month, setMonth] = useState(() => initialMonth(dates));
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = todayISO();
  const upcoming = [...selected].filter((d) => d >= today).sort();
  const monthDays = monthCells(month.y, month.m).filter((d): d is string => !!d && d >= today);
  const allMonthSelected = monthDays.length > 0 && monthDays.every((d) => selected.has(d));

  function update(fn: (next: Set<string>) => void) {
    setSelected((prev) => {
      const next = new Set(prev);
      fn(next);
      return next;
    });
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setAvailableDates(restaurantId, upcoming);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <DateCalendar
        month={month}
        onMonthChange={setMonth}
        marked={selected}
        onDayClick={(iso) => update((s) => (s.has(iso) ? s.delete(iso) : s.add(iso)))}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!monthDays.length}
          onClick={() => update((s) => monthDays.forEach((d) => (allMonthSelected ? s.delete(d) : s.add(d))))}
        >
          {allMonthSelected ? "Энэ сарыг цэвэрлэх" : "Энэ сарын бүх өдөр"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!monthDays.length}
          onClick={() =>
            update((s) =>
              monthDays.forEach((d) => {
                const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
                if (wd === 5 || wd === 6) s.add(d);
              }),
            )
          }
        >
          Баасан, Бямба гарагууд
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {upcoming.length ? (
          <>
            <span className="font-semibold text-foreground">{upcoming.length}</span> өдөр сонгосон
            {upcoming.length <= 6 && `: ${upcoming.map((d) => formatDayMN(d)).join(", ")}`}
          </>
        ) : (
          "Өдөр сонгоогүй байна. Хуанли дээрх өдрүүдийг дарж сонгоно уу."
        )}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || saved}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Өдрүүдийг хадгалах
        </Button>
        {saved && !pending && (
          <span className="inline-flex items-center gap-1 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Хадгалагдсан
          </span>
        )}
      </div>
    </div>
  );
}

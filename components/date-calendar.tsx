"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, monthCells, monthLabel, todayISO, WEEKDAYS } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Props = {
  month: { y: number; m: number };
  onMonthChange: (month: { y: number; m: number }) => void;
  /** Тодруулах (сонгосон / сул) өдрүүд. */
  marked: ReadonlySet<string>;
  /** Идэвхтэй сонгосон нэг өдөр (нийтийн хуудсанд). */
  active?: string | null;
  onDayClick?: (iso: string) => void;
  /** true бол тэмдэглэгдээгүй өдрийг дарах боломжгүй (зөвхөн харах). */
  markedOnly?: boolean;
  className?: string;
};

/** Хөнгөн сарын хуанли — гаднын сангүй. Өнгөрсөн өдрүүд идэвхгүй. */
export function DateCalendar({ month, onMonthChange, marked, active, onDayClick, markedOnly, className }: Props) {
  const today = todayISO();
  const [ty, tm] = today.split("-").map(Number);
  const atStart = month.y * 12 + month.m <= ty * 12 + (tm - 1);

  return (
    <div className={cn("select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Өмнөх сар"
          disabled={atStart}
          onClick={() => onMonthChange(addMonths(month.y, month.m, -1))}
          className="grid h-8 w-8 place-items-center rounded-lg border bg-card hover:bg-accent disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold">{monthLabel(month.y, month.m)}</p>
        <button
          type="button"
          aria-label="Дараах сар"
          onClick={() => onMonthChange(addMonths(month.y, month.m, 1))}
          className="grid h-8 w-8 place-items-center rounded-lg border bg-card hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {monthCells(month.y, month.m).map((iso, i) => {
          if (!iso) return <span key={i} />;
          const past = iso < today;
          const isMarked = marked.has(iso);
          const disabled = past || !onDayClick || (markedOnly && !isMarked);
          return (
            <button
              key={iso}
              type="button"
              data-date={iso}
              aria-pressed={isMarked}
              disabled={disabled}
              onClick={() => onDayClick?.(iso)}
              className={cn(
                "relative aspect-square rounded-lg text-sm tabular-nums transition-colors",
                past && "text-muted-foreground/40",
                !past && !isMarked && "text-foreground/70",
                !past && !isMarked && !disabled && "hover:bg-accent",
                isMarked && !past && "bg-primary font-semibold text-white hover:bg-primary/90",
                isMarked && past && "bg-muted line-through",
                active === iso && "ring-2 ring-primary ring-offset-2",
                iso === today && !isMarked && "font-bold text-primary",
                disabled && "cursor-default",
              )}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

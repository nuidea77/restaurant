"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { AMENITIES, BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, CAPACITY_RANGES, DISTRICTS } from "@/lib/constants";
import { formatMNT } from "@/lib/utils";

export type FilterValues = {
  district?: string;
  minPrice: number;
  maxPrice: number;
  capacity?: string;
  amenities: string[];
};

// Утга өөрчлөгдөх бүрт URL-ийг шинэчилж шууд хайна. JS-гүй орчинд энгийн GET форм хэвээр ажиллана.
export function Filters({ initial }: { initial: FilterValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [budget, setBudget] = useState<number[]>([initial.minPrice, initial.maxPrice]);
  const [pending, startTransition] = useTransition();

  function apply(range = budget) {
    if (!formRef.current) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(formRef.current)) {
      if (key !== "min" && key !== "max" && value) params.set(key, String(value));
    }
    if (range[0] > BUDGET_MIN) params.set("min", String(range[0]));
    if (range[1] < BUDGET_MAX) params.set("max", String(range[1]));
    const query = params.toString();
    startTransition(() => router.replace(query ? `/?${query}` : "/", { scroll: false }));
  }

  return (
    <form
      ref={formRef}
      method="get"
      action="/"
      onChange={() => apply()}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-5 rounded-lg border bg-card p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="district">Дүүрэг</Label>
        <Select id="district" name="district" defaultValue={initial.district ?? ""}>
          <option value="">Бүх дүүрэг</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        <Label>1 хүний төсөв</Label>
        <Slider min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP} value={budget} onValueChange={setBudget} onValueCommit={apply} minStepsBetweenThumbs={1} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatMNT(budget[0])}</span>
          <span>
            {formatMNT(budget[1])}
            {budget[1] >= BUDGET_MAX ? "+" : ""}
          </span>
        </div>
        {budget[0] > BUDGET_MIN && <input type="hidden" name="min" value={budget[0]} />}
        {budget[1] < BUDGET_MAX && <input type="hidden" name="max" value={budget[1]} />}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Багтаамж</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="capacity" value="" defaultChecked={!initial.capacity} /> Хамаагүй
        </label>
        {CAPACITY_RANGES.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-sm">
            <input type="radio" name="capacity" value={c.key} defaultChecked={initial.capacity === c.key} /> {c.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Үйлчилгээний нөхцөл</legend>
        {AMENITIES.map((a) => (
          <label key={a.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={a.key} value="1" defaultChecked={initial.amenities.includes(a.key)} /> {a.label}
          </label>
        ))}
      </fieldset>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {pending ? "Хайж байна..." : ""}
        </span>
        <noscript>
          <Button type="submit">Шүүх</Button>
        </noscript>
        <Link href="/" scroll={false} className="inline-flex h-10 items-center rounded-md border px-4 text-sm hover:bg-muted">
          Цэвэрлэх
        </Link>
      </div>
    </form>
  );
}

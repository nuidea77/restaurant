"use client";

import { useState } from "react";
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

// GET форм тул JS-гүй орчинд ч ажиллана; slider-ийн утгыг hidden input-ээр дамжуулна.
export function Filters({ initial }: { initial: FilterValues }) {
  const [budget, setBudget] = useState<number[]>([initial.minPrice, initial.maxPrice]);

  return (
    <form method="get" action="/" className="space-y-5 rounded-lg border bg-card p-5">
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
        <Slider min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP} value={budget} onValueChange={setBudget} minStepsBetweenThumbs={1} />
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

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Шүүх
        </Button>
        <a href="/" className="inline-flex h-10 items-center rounded-md border px-4 text-sm hover:bg-muted">
          Цэвэрлэх
        </a>
      </div>
    </form>
  );
}

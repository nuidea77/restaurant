"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { AMENITIES, BUDGET_MAX, BUDGET_MIN, BUDGET_STEP, CAPACITY_RANGES, CITIES, DISTRICTS, UB } from "@/lib/constants";
import { formatMNT } from "@/lib/utils";

export type FilterValues = {
  city?: string;
  district?: string;
  minPrice: number;
  maxPrice: number;
  capacity?: string;
  amenities: string[];
};

const chip =
  "cursor-pointer select-none rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:bg-accent has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

// Утга өөрчлөгдөх бүрт URL-ийг шинэчилж шууд хайна. JS-гүй орчинд энгийн GET форм хэвээр ажиллана.
export function Filters({ initial }: { initial: FilterValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [budget, setBudget] = useState<number[]>([initial.minPrice, initial.maxPrice]);
  const [pending, startTransition] = useTransition();
  const [city, setCity] = useState(initial.city ?? "");

  const activeCount =
    (initial.city ? 1 : 0) +
    (initial.district ? 1 : 0) +
    (initial.capacity ? 1 : 0) +
    initial.amenities.length +
    (initial.minPrice > BUDGET_MIN || initial.maxPrice < BUDGET_MAX ? 1 : 0);

  function apply(range = budget) {
    if (!formRef.current) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(formRef.current)) {
      if (key !== "min" && key !== "max" && value) params.set(key, String(value));
    }
    if (range[0] > BUDGET_MIN) params.set("min", String(range[0]));
    if (range[1] < BUDGET_MAX) params.set("max", String(range[1]));
    const query = params.toString();
    startTransition(() => router.replace(query ? `/?${query}` : "/#results", { scroll: false }));
  }

  return (
    <Card className="overflow-hidden">
      <CardBar
        icon={pending ? <Loader2 className="animate-spin" /> : <SlidersHorizontal />}
        title={pending ? "Хайж байна..." : "Шүүлтүүр"}
        count={activeCount}
      />
      <form
        ref={formRef}
        method="get"
        action="/"
        onChange={() => apply()}
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="space-y-6 p-4"
      >
        <div className="space-y-2">
          <Label htmlFor="city">Хот / аймаг</Label>
          <Select className="w-full" id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Бүх хот, аймаг</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        {(city === "" || city === UB) && (
          <div className="space-y-2">
            <Label htmlFor="district">Дүүрэг</Label>
            <Select className="w-full" id="district" name="district" defaultValue={initial.district ?? ""}>
              <option value="">Бүх дүүрэг</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label>1 хүний төсөв</Label>
            <span className="text-xs text-muted-foreground">₮</span>
          </div>
          <Slider
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            value={budget}
            onValueChange={(v) => setBudget([...(v as readonly number[])])}
            onValueCommitted={(v) => apply([...(v as readonly number[])])}
            minStepsBetweenValues={1}
          />
          <div className="flex justify-between gap-2 text-sm tabular-nums">
            <span className="rounded-md border bg-accent px-2 py-0.5">{formatMNT(budget[0])}</span>
            <span className="rounded-md border bg-accent px-2 py-0.5">
              {formatMNT(budget[1])}
              {budget[1] >= BUDGET_MAX ? "+" : ""}
            </span>
          </div>
          {budget[0] > BUDGET_MIN && <input type="hidden" name="min" value={budget[0]} />}
          {budget[1] < BUDGET_MAX && <input type="hidden" name="max" value={budget[1]} />}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Багтаамж</legend>
          <div className="flex flex-wrap gap-2">
            <label className={chip}>
              <input type="radio" name="capacity" value="" defaultChecked={!initial.capacity} className="sr-only" />
              Хамаагүй
            </label>
            {CAPACITY_RANGES.map((c) => (
              <label key={c.key} className={chip}>
                <input type="radio" name="capacity" value={c.key} defaultChecked={initial.capacity === c.key} className="sr-only" />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Үйлчилгээний нөхцөл</legend>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <label key={a.key} className={chip}>
                <input type="checkbox" name={a.key} value="1" defaultChecked={initial.amenities.includes(a.key)} className="sr-only" />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-2 border-t pt-4">
          <noscript>
            <Button type="submit">Шүүх</Button>
          </noscript>
          <Link
            href="/#results"
            scroll={false}
            className={buttonVariants({ variant: "outline", className: "flex-1" })}
          >
            Шүүлтүүр цэвэрлэх
          </Link>
        </div>
      </form>
    </Card>
  );
}

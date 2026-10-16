"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Plus } from "lucide-react";
import { createPackage, deletePackage, updatePackage } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pricePerPerson } from "@/lib/pricing";
import type { MenuPackage } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

type Props = { pkg: MenuPackage } | { pkg?: undefined; restaurantId: string; onDone: () => void };

/**
 * Human-in-the-Loop: AI-ийн задалсан багцыг менежер шалгаж, засаж, баталгаажуулна.
 * `pkg` дамжуулаагүй бол шинэ багцыг гараар нэмэх маягт болно.
 */
export function PackageReview(props: Props) {
  const { pkg } = props;
  const [name, setName] = useState(pkg?.package_name ?? "");
  const [total, setTotal] = useState(pkg ? String(pkg.total_price) : "");
  const [count, setCount] = useState(pkg ? String(pkg.person_count) : "");
  const [items, setItems] = useState(pkg?.items.join("\n") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const perPerson = pricePerPerson(Number(total) || 0, Number(count) || 1);

  function save(verify: boolean) {
    setError(null);
    const input = { package_name: name, total_price: total, person_count: count, items: items.split("\n") };
    startTransition(async () => {
      const res = props.pkg
        ? await updatePackage(props.pkg.id, input, verify)
        : await createPackage(props.restaurantId, input, verify);
      if (!res.ok) setError(res.error);
      else if (!props.pkg) props.onDone();
    });
  }

  function remove() {
    if (!pkg) return;
    if (!confirm("Энэ багцыг устгах уу?")) return;
    startTransition(async () => {
      const res = await deletePackage(pkg.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <Card className={!pkg ? "border-primary/40 ring-4 ring-primary/10" : pkg.is_verified ? "" : "border-amber-300 ring-4 ring-amber-50"}>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          {!pkg ? (
            <Badge className="border-primary/30 bg-brand-soft text-primary">
              <Plus className="mr-1 h-3 w-3" /> Шинэ багц
            </Badge>
          ) : pkg.is_verified ? (
            <Badge className="border-green-300 bg-green-50 text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Нийтлэгдсэн
            </Badge>
          ) : (
            <Badge className="border-amber-300 bg-amber-50 text-amber-800">Шалгах шаардлагатай</Badge>
          )}
          {pkg?.file_url ? (
            <a href={pkg.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
              Эх файл <ExternalLink className="h-3 w-3" />
            </a>
          ) : pkg ? (
            <span className="text-xs text-muted-foreground">Гараар нэмсэн</span>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Багцын нэр</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ: Алтан багц" autoFocus={!pkg} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Нийт үнэ (₮)</Label>
            <Input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="1200000" />
          </div>
          <div className="space-y-2">
            <Label>Хүний тоо</Label>
            <Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} placeholder="10" />
          </div>
        </div>
        <p className="text-sm">
          1 хүний үнэ: <span className="font-semibold text-brand">{formatMNT(perPerson)}</span>
        </p>
        <div className="space-y-2">
          <Label>Багтсан бүтээгдэхүүн (мөр бүрт нэг)</Label>
          <Textarea
            rows={6}
            value={items}
            onChange={(e) => setItems(e.target.value)}
            placeholder={"Хүйтэн зууш\nҮндсэн хоол\nАмттан\nУндаа"}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!pkg ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save(true)} disabled={pending}>
              Нэмж нийтлэх
            </Button>
            <Button variant="outline" onClick={() => save(false)} disabled={pending}>
              Ноорог хадгалах
            </Button>
            <Button variant="ghost" onClick={props.onDone} disabled={pending}>
              Болих
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save(true)} disabled={pending}>
              {pkg.is_verified ? "Хадгалах" : "Баталгаажуулах"}
            </Button>
            {pkg.is_verified && (
              <Button variant="outline" onClick={() => save(false)} disabled={pending}>
                Нийтлэлээс хасах
              </Button>
            )}
            <Button variant="ghost" className="text-destructive" onClick={remove} disabled={pending}>
              Устгах
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

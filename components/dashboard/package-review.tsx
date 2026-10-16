"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { deletePackage, updatePackage } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { pricePerPerson } from "@/lib/pricing";
import type { MenuPackage } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

/** Human-in-the-Loop: AI-ийн задалсан багцыг менежер шалгаж, засаж, баталгаажуулна. */
export function PackageReview({ pkg }: { pkg: MenuPackage }) {
  const [name, setName] = useState(pkg.package_name);
  const [total, setTotal] = useState(String(pkg.total_price));
  const [count, setCount] = useState(String(pkg.person_count));
  const [items, setItems] = useState(pkg.items.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const perPerson = pricePerPerson(Number(total) || 0, Number(count) || 1);

  function save(verify: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await updatePackage(
        pkg.id,
        { package_name: name, total_price: total, person_count: count, items: items.split("\n") },
        verify,
      );
      if (!res.ok) setError(res.error);
    });
  }

  function remove() {
    if (!confirm("Энэ багцыг устгах уу?")) return;
    startTransition(async () => {
      const res = await deletePackage(pkg.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <Card className={pkg.is_verified ? "" : "border-amber-400"}>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          {pkg.is_verified ? (
            <Badge className="border-green-300 bg-green-50 text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Нийтлэгдсэн
            </Badge>
          ) : (
            <Badge className="border-amber-300 bg-amber-50 text-amber-800">Шалгах шаардлагатай</Badge>
          )}
          <a href={pkg.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
            Эх файл <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-2">
          <Label>Багцын нэр</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Нийт үнэ (₮)</Label>
            <Input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Хүний тоо</Label>
            <Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} />
          </div>
        </div>
        <p className="text-sm">
          1 хүний үнэ: <span className="font-semibold text-primary">{formatMNT(perPerson)}</span>
        </p>
        <div className="space-y-2">
          <Label>Багтсан бүтээгдэхүүн (мөр бүрт нэг)</Label>
          <Textarea rows={6} value={items} onChange={(e) => setItems(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
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
      </CardContent>
    </Card>
  );
}

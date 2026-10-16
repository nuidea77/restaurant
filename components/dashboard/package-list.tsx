"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { PackageReview } from "@/components/dashboard/package-review";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { MenuPackage } from "@/lib/types";

/** Багцуудын жагсаалт: AI-ийн гаргасныг шалгах, мөн шинэ багцыг гараар нэмэх. */
export function PackageList({ restaurantId, packages }: { restaurantId: string; packages: MenuPackage[] }) {
  const [adding, setAdding] = useState(false);
  const pendingCount = packages.filter((p) => !p.is_verified).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Багцууд</h2>
          <p className="mt-1 text-muted-foreground">AI-ийн гаргасан багцыг шалгаж засах, эсвэл шинэ багцаа гараар нэмнэ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
              {pendingCount} багц шалгах шаардлагатай
            </span>
          )}
          {!adding && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Багц нэмэх
            </Button>
          )}
        </div>
      </div>
      {!packages.length && !adding && (
        <Empty className="rounded-xl border border-dashed bg-card py-12">
          <EmptyHeader className="mb-0">
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>Одоогоор багц алга</EmptyTitle>
            <EmptyDescription>Дээрээс цэсээ байршуулахад AI багцуудыг энд гаргана. Эсвэл &quot;Багц нэмэх&quot; дарж гараар оруулна уу.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {adding && <PackageReview restaurantId={restaurantId} onDone={() => setAdding(false)} />}
        {packages.map((p) => (
          <PackageReview key={`${p.id}-${p.is_verified}-${p.total_price}`} pkg={p} />
        ))}
      </div>
    </>
  );
}

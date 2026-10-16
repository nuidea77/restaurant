"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { payListing, payWithByl } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { formatMNT } from "@/lib/utils";

export function PayButton({
  provider,
  paymentId,
  restaurantId,
  amount,
}: {
  provider: "byl" | "demo";
  paymentId: string;
  restaurantId: string;
  amount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = provider === "byl" ? await payWithByl(paymentId) : await payListing(paymentId, restaurantId);
            if (res && !res.ok) setError(res.error);
          })
        }
      >
        <CreditCard className="h-4 w-4" />
        {pending
          ? provider === "byl"
            ? "Byl руу шилжиж байна..."
            : "Төлж байна..."
          : provider === "byl"
            ? `Byl-ээр ${formatMNT(amount)} төлөх`
            : `${formatMNT(amount)} төлөх`}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { payListing } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { formatMNT } from "@/lib/utils";

export function PayButton({ paymentId, restaurantId, amount }: { paymentId: string; restaurantId: string; amount: number }) {
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
            const res = await payListing(paymentId, restaurantId);
            if (res && !res.ok) setError(res.error);
          })
        }
      >
        <CreditCard className="h-4 w-4" /> {pending ? "Төлж байна..." : `${formatMNT(amount)} төлөх`}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

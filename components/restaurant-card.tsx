import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import { AMENITIES } from "@/lib/constants";
import type { RestaurantSearchRow } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

export function RestaurantCard({ r }: { r: RestaurantSearchRow }) {
  const cover = r.images?.[0];
  const priceLabel =
    Number(r.min_price) === Number(r.max_price)
      ? formatMNT(r.min_price)
      : `${formatMNT(r.min_price)} – ${formatMNT(r.max_price)}`;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/restaurants/${r.id}`} className="block">
        <div className="aspect-[16/9] bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="text-lg font-semibold">{r.name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {r.district}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {r.capacity} хүн
            </span>
          </div>
          <p className="text-base">
            <span className="font-semibold text-primary">{priceLabel}</span>
            <span className="text-sm text-muted-foreground"> / 1 хүн · {r.package_count} багц</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {AMENITIES.filter((a) => r[a.key]).map((a) => (
              <Badge key={a.key}>{a.label}</Badge>
            ))}
          </div>
        </div>
      </Link>
    </Card>
  );
}

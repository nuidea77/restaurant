import Link from "next/link";
import { ArrowUpRight, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AMENITIES } from "@/lib/constants";
import type { RestaurantSearchRow } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

export function RestaurantCard({ r }: { r: RestaurantSearchRow }) {
  const cover = r.images?.[0];
  const priceLabel =
    Number(r.min_price) === Number(r.max_price) ? formatMNT(r.min_price) : `${formatMNT(r.min_price)} – ${formatMNT(r.max_price)}`;

  return (
    <Link
      href={`/restaurants/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate">{r.district}</span>
        <span className="rounded-md border bg-accent px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
          {r.package_count} багц
        </span>
      </div>
      <div className="p-3 pb-0">
        <div className="aspect-[16/9] overflow-hidden rounded-lg bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={r.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[17px] font-semibold tracking-tight">{r.name}</h3>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-brand" />
        </div>
        <div className="flex items-end justify-between gap-2">
          <p>
            <span className="text-lg font-bold tracking-tight text-brand">{priceLabel}</span>
            <span className="text-sm text-muted-foreground"> / хүн</span>
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {r.capacity}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap gap-1">
          {AMENITIES.filter((a) => r[a.key]).map((a) => (
            <Badge key={a.key} variant="outline">{a.label}</Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}

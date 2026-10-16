import Link from "next/link";
import { MapPin, Users, UtensilsCrossed } from "lucide-react";
import { AMENITIES, UB } from "@/lib/constants";
import type { RestaurantSearchRow } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

export function RestaurantCard({ r }: { r: RestaurantSearchRow }) {
  const cover = r.images?.[0];
  const sameRange = Number(r.min_price) === Number(r.max_price);
  const place = r.city === UB ? r.district : `${r.city}, ${r.district}`;
  const amenities = AMENITIES.filter((a) => r[a.key]);

  return (
    <Link
      href={`/restaurants/${r.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={r.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          <MapPin className="h-3.5 w-3.5 text-primary" /> {place}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {r.package_count} багц
        </span>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
          <h3 className="text-lg font-semibold leading-tight tracking-tight drop-shadow">{r.name}</h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs backdrop-blur">
            <Users className="h-3.5 w-3.5" /> {r.capacity}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm text-muted-foreground">1 хүнд</p>
          <p className="text-right">
            <span className="text-xl font-extrabold tracking-tight text-primary">
              {sameRange ? formatMNT(r.min_price) : `${formatMNT(r.min_price)}`}
            </span>
            {!sameRange && <span className="text-sm text-muted-foreground"> – {formatMNT(r.max_price)}</span>}
          </p>
        </div>
        {amenities.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 border-t pt-3">
            {amenities.map((a) => (
              <span key={a.key} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/75">
                {a.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

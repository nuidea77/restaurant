import Link from "next/link";
import { Clock, MapPin, Music2, PartyPopper, Users } from "lucide-react";
import { VenueIcon } from "@/components/venue-icon";
import { UB, venueTypeLabel } from "@/lib/constants";
import { WEEKDAYS } from "@/lib/dates";
import type { EventListRow } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

export function weekdayOf(iso: string) {
  return WEEKDAYS[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7];
}

/** Эвентийн огнооны "хуанлийн хуудас" тэмдэг. */
export function DateBadge({ iso, className = "" }: { iso: string; className?: string }) {
  return (
    <span className={`flex w-14 flex-col items-center overflow-hidden rounded-xl bg-white text-foreground shadow-lg ${className}`}>
      <span className="w-full bg-primary py-0.5 text-center text-[10px] font-semibold text-white">{Number(iso.slice(5, 7))}-р сар</span>
      <span className="text-2xl font-extrabold leading-tight tabular-nums">{Number(iso.slice(8))}</span>
      <span className="pb-1 text-[10px] font-medium text-muted-foreground">{weekdayOf(iso)}</span>
    </span>
  );
}

export function EventCard({ e }: { e: EventListRow }) {
  const place = e.city === UB ? e.district : `${e.city}, ${e.district}`;
  return (
    <Link
      href={`/events/${e.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {e.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.cover} alt={e.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="hero-glow flex h-full items-center justify-center text-primary">
            <PartyPopper className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <DateBadge iso={e.event_date} className="absolute left-3 top-3" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <Users className="h-3.5 w-3.5" /> {e.capacity} хүн
        </span>
        <div className="absolute inset-x-3 bottom-3 text-white">
          <h3 className="text-lg font-bold leading-tight tracking-tight drop-shadow">{e.title}</h3>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-white/85">
            <VenueIcon type={e.venue_type} className="h-3.5 w-3.5" /> {e.venue_name} · {venueTypeLabel(e.venue_type)}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {e.artists.length > 0 && (
          <p className="flex items-start gap-1.5 text-sm">
            <Music2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="line-clamp-2">{e.artists.join(" · ")}</span>
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-3">
          <span className="space-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {place}
            </span>
            {e.start_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {e.start_time}-аас
              </span>
            )}
          </span>
          <span className="text-right">
            <span className="block text-xs text-muted-foreground">1 хүн</span>
            <span className="text-xl font-extrabold tracking-tight text-primary">{e.ticket_price ? formatMNT(e.ticket_price) : "Үнэгүй"}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

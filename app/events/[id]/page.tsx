import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock, MapPin, Music2, Navigation, Phone, Users, UtensilsCrossed } from "lucide-react";
import { DateBadge } from "@/components/event-card";
import { VenueIcon } from "@/components/venue-icon";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Section } from "@/components/ui/frame";
import { UB, venueTypeLabel } from "@/lib/constants";
import { formatDayMN, todayISO } from "@/lib/dates";
import { getEvent } from "@/lib/queries";
import { formatMNT } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = await getEvent((await params).id);
  if (!e) return {};
  return {
    title: `${e.title} — ${e.venue_name}`,
    description: `${formatDayMN(e.event_date)} · 1 хүн ${formatMNT(e.ticket_price)} · ${e.artists.join(", ")}`,
    openGraph: e.cover ? { images: [e.cover] } : undefined,
  };
}

export default async function EventPage({ params }: { params: Params }) {
  const e = await getEvent((await params).id);
  if (!e) notFound();

  const past = e.event_date < todayISO();
  const place = `${e.city === UB ? "" : `${e.city}, `}${e.district}, ${e.address}`;
  const mapQuery = e.latitude != null && e.longitude != null ? `${e.latitude},${e.longitude}` : place;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
  const tel = `tel:${e.phone.replace(/\s/g, "")}`;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        {e.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.cover} alt={e.venue_name} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : (
          <div className="hero-glow absolute inset-0 -z-10" />
        )}
        {e.cover && <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/50 to-black/25" />}
        <div className={`px-4 pb-8 pt-6 sm:px-8 ${e.cover ? "text-white" : ""}`}>
          <Link
            href="/events"
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm backdrop-blur ${
              e.cover ? "bg-white/15 text-white hover:bg-white/25" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowLeft className="h-4 w-4" /> Бүх эвент
          </Link>
          <div className="mt-20 flex flex-wrap items-end justify-between gap-6 sm:mt-32">
            <div className="flex items-end gap-4">
              <DateBadge iso={e.event_date} className="w-16 shrink-0" />
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-[-0.03em] drop-shadow sm:text-5xl">{e.title}</h1>
                <p className={`flex flex-wrap gap-x-5 gap-y-1 ${e.cover ? "text-white/85" : "text-muted-foreground"}`}>
                  <span className="inline-flex items-center gap-1.5">
                    <VenueIcon type={e.venue_type} className="h-4 w-4" /> {e.venue_name} · {venueTypeLabel(e.venue_type)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {e.city === UB ? e.district : `${e.city}, ${e.district}`}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-white px-4 py-2 text-foreground shadow-lg">
                <p className="text-xs text-muted-foreground">1 хүний тасалбар</p>
                <p className="text-lg font-bold text-primary">{e.ticket_price ? formatMNT(e.ticket_price) : "Үнэгүй"}</p>
              </div>
              {!past && (
                <a href={tel} className={buttonVariants({ size: "lg", className: "shadow-lg" })}>
                  <Phone className="h-4 w-4" /> Суудал захиалах
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact icon={<CalendarDays />} label="Огноо" value={formatDayMN(e.event_date, true)} />
            <Fact icon={<Clock />} label="Эхлэх цаг" value={e.start_time ?? "Тодорхойгүй"} />
            <Fact icon={<Users />} label="Хүний тоо" value={`${e.capacity} суудал`} />
            <Fact icon={<UtensilsCrossed />} label="1 хүн" value={e.ticket_price ? formatMNT(e.ticket_price) : "Үнэгүй"} />
          </div>
          {past && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">Энэ эвент өнгөрсөн байна.</p>
          )}

          {e.artists.length > 0 && (
            <Card className="overflow-hidden">
              <CardBar icon={<Music2 />} title="Оролцох уран бүтээлчид" count={e.artists.length} />
              <ul className="grid gap-2 p-5 sm:grid-cols-2">
                {e.artists.map((a) => (
                  <li key={a} className="flex items-center gap-3 rounded-xl border bg-brand-soft/60 p-3 font-medium">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white">
                      <Music2 className="h-4 w-4" />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {e.items.length > 0 && (
            <Card className="overflow-hidden">
              <CardBar icon={<UtensilsCrossed />} title="Хоол, ширээн дээрх зүйлс" count={e.items.length} />
              <ul className="grid gap-2 p-5 text-sm sm:grid-cols-2">
                {e.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {e.description && <p className="whitespace-pre-line text-foreground/80">{e.description}</p>}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <CardBar icon={<VenueIcon type={e.venue_type} />} title="Зохион байгуулагч газар" />
            <div className="space-y-4 p-5">
              <div>
                <p className="text-lg font-semibold tracking-tight">{e.venue_name}</p>
                <p className="text-sm text-muted-foreground">{place}</p>
              </div>
              <a href={tel} className={buttonVariants({ className: "w-full" })}>
                <Phone className="h-4 w-4" /> {e.phone}
              </a>
              <Link href={`/restaurants/${e.restaurant_id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                Газрын мэдээлэл <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={directionsUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
                <Navigation className="h-4 w-4" /> Зам заах
              </a>
            </div>
          </Card>
        </aside>
      </Section>
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tracking-tight">{value}</p>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, MapPin, Navigation, Phone, Users, UtensilsCrossed } from "lucide-react";
import { Gallery, SourceFiles } from "@/components/gallery";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBar } from "@/components/ui/card";
import { Divider, Section } from "@/components/ui/frame";
import { AMENITIES, UB } from "@/lib/constants";
import { getPackages, getRestaurant } from "@/lib/queries";
import { formatMNT } from "@/lib/utils";
import { AmenityIcon } from "@/components/amenity-icon";

type Params = Promise<{ id: string }>;

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const restaurant = await getRestaurant(id);
  if (!restaurant) return null;
  const packages = await getPackages(id, true);
  return { restaurant, packages };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load((await params).id);
  if (!data) return {};
  const { restaurant: r, packages } = data;
  const from = packages[0] ? ` · 1 хүн ${formatMNT(packages[0].price_per_person)}-аас` : "";
  return {
    title: `${r.name} — Шинэ жилийн багц`,
    description: `${r.city}, ${r.district}, ${r.capacity} хүний багтаамжтай${from}`,
    openGraph: r.images[0] ? { images: [r.images[0]] } : undefined,
  };
}

export default async function RestaurantPage({ params }: { params: Params }) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { restaurant: r, packages } = data;

  const sourceFiles = [...new Set(packages.map((p) => p.file_url))];
  const mapQuery = r.latitude != null && r.longitude != null ? `${r.latitude},${r.longitude}` : `${r.address}, ${r.district}, ${r.city}`;
  // Түлхүүртэй бол Google Maps Embed API (албан ёсны), үгүй бол түлхүүргүй embed.
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapSrc = mapsKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(mapQuery)}&language=mn&zoom=16`
    : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  const cheapest = packages[0]?.price_per_person;

  return (
    <>
      {/* Cover зурагтай дээд хэсэг */}
      <section className="relative isolate overflow-hidden">
        {r.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.images[0]} alt={r.name} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : (
          <div className="hero-glow absolute inset-0 -z-10" />
        )}
        {r.images[0] && <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />}
        <div className={`px-4 pb-8 pt-6 sm:px-8 ${r.images[0] ? "text-white" : ""}`}>
          <Link
            href="/#results"
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm backdrop-blur ${
              r.images[0] ? "bg-white/15 text-white hover:bg-white/25" : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowLeft className="h-4 w-4" /> Бүх ресторан
          </Link>
          <div className="mt-24 flex flex-wrap items-end justify-between gap-6 sm:mt-40">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {AMENITIES.filter((a) => r[a.key]).map((a) => (
                  <span
                    key={a.key}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur ${
                      r.images[0] ? "bg-white/15 text-white" : "border bg-card"
                    }`}
                  >
                    <AmenityIcon amenity={a.key} className="h-3.5 w-3.5" /> {a.label}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] drop-shadow sm:text-5xl">{r.name}</h1>
              <div className={`flex flex-wrap gap-x-5 gap-y-1 ${r.images[0] ? "text-white/85" : "text-muted-foreground"}`}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {r.city === UB ? "" : `${r.city}, `}
                  {r.district}, {r.address}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {r.capacity} хүний багтаамж
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {cheapest != null && (
                <div className="rounded-xl bg-white px-4 py-2 text-foreground shadow-lg">
                  <p className="text-xs text-muted-foreground">1 хүнд</p>
                  <p className="text-lg font-bold text-primary">{formatMNT(cheapest)}-өөс</p>
                </div>
              )}
              <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={buttonVariants({ size: "lg", className: "shadow-lg" })}>
                <Phone className="h-4 w-4" /> Залгах
              </a>
            </div>
          </div>
        </div>
      </section>

      <Section className="space-y-6">
        {r.description && <p className="max-w-3xl whitespace-pre-line text-lg text-foreground/80">{r.description}</p>}
        {/* Үйлчилгээний нөхцөл — байгаа/байхгүйг хоёуланг нь харуулна */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {AMENITIES.map((a) => {
            const has = r[a.key];
            return (
              <div
                key={a.key}
                className={`flex items-center gap-3 rounded-xl border p-3 ${has ? "border-primary/30 bg-brand-soft" : "bg-card opacity-60"}`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${has ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                >
                  <AmenityIcon amenity={a.key} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${has ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {a.short}
                  </span>
                  <span className="block text-xs text-muted-foreground">{has ? a.hint : "Байхгүй"}</span>
                </span>
              </div>
            );
          })}
        </div>
        {r.images.length > 1 && <Gallery images={r.images} name={r.name} />}
      </Section>

      <Divider />

      <Section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Шинэ жилийн багцууд</h2>
            <p className="mt-1 text-muted-foreground">Үнийг 1 хүнд ногдохоор тооцсон. Ширээний багцыг хүний тоонд хуваасан.</p>
          </div>
          <SourceFiles urls={sourceFiles} />
        </div>
        {packages.length === 0 && <p className="text-muted-foreground">Баталгаажсан багц одоогоор алга.</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((p) => (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <CardBar icon={<UtensilsCrossed />} title={p.package_name} count={`${p.person_count} хүн`} />
              <div className="p-5">
                <p>
                  <span className="text-3xl font-extrabold tracking-tight text-brand">{formatMNT(p.price_per_person)}</span>
                  <span className="text-muted-foreground"> / 1 хүн</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Нийт {formatMNT(p.total_price)} · {p.person_count} хүний
                </p>
              </div>
              {p.items.length > 0 && (
                <ul className="mt-auto space-y-2 border-t bg-accent/60 p-5 text-sm">
                  {p.items.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </Section>

      <Divider />

      <Section className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardBar icon={<Phone />} title="Холбоо барих" />
          <div className="space-y-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Утас</p>
              <p className="text-xl font-semibold tracking-tight">{r.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Хаяг</p>
              <p>
                {r.city === UB ? "" : `${r.city}, `}
                {r.district}, {r.address}
              </p>
            </div>
            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={buttonVariants({ className: "w-full" })}>
              <Phone className="h-4 w-4" /> Шууд залгах
            </a>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardBar icon={<MapPin />} title="Байршил" />
          <iframe src={mapSrc} title="Байршил" className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <div className="border-t p-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              <Navigation className="h-4 w-4" /> Google Maps-ээр зам заах
            </a>
          </div>
        </Card>
      </Section>
    </>
  );
}

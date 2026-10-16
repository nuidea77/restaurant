import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, MapPin, Phone, Users, UtensilsCrossed } from "lucide-react";
import { Gallery, SourceFiles } from "@/components/gallery";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardBar } from "@/components/ui/card";
import { Divider, Section } from "@/components/ui/frame";
import { AMENITIES } from "@/lib/constants";
import { getPackages, getRestaurant } from "@/lib/queries";
import { formatMNT } from "@/lib/utils";

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
    description: `${r.district}, ${r.capacity} хүний багтаамжтай${from}`,
    openGraph: r.images[0] ? { images: [r.images[0]] } : undefined,
  };
}

export default async function RestaurantPage({ params }: { params: Params }) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { restaurant: r, packages } = data;

  const sourceFiles = [...new Set(packages.map((p) => p.file_url))];
  const mapQuery = r.latitude != null && r.longitude != null ? `${r.latitude},${r.longitude}` : `${r.address}, ${r.district}, Улаанбаатар`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const cheapest = packages[0]?.price_per_person;

  return (
    <>
      <Section className="hero-glow pb-8">
        <Link href="/#results" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Бүх ресторан
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {AMENITIES.filter((a) => r[a.key]).map((a) => (
                <Badge key={a.key} variant="outline" className="bg-card">
                  <Check className="h-3 w-3 text-brand" /> {a.label}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">{r.name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {r.district}, {r.address}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {r.capacity} хүний багтаамж
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {cheapest != null && (
              <div className="rounded-xl border bg-card px-4 py-2 shadow-sm">
                <p className="text-xs text-muted-foreground">1 хүнд</p>
                <p className="text-lg font-bold text-brand">{formatMNT(cheapest)}-өөс</p>
              </div>
            )}
            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={buttonVariants({ size: "lg" })}>
              <Phone className="h-4 w-4" /> Залгах
            </a>
          </div>
        </div>
        {r.description && <p className="mt-6 max-w-3xl whitespace-pre-line text-foreground/75">{r.description}</p>}
      </Section>

      {r.images.length > 0 && (
        <Section className="pt-0">
          <Gallery images={r.images} name={r.name} />
        </Section>
      )}

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
          <iframe src={mapSrc} title="Байршил" className="h-72 w-full" loading="lazy" />
        </Card>
      </Section>
    </>
  );
}

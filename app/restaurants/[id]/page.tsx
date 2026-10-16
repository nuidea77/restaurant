import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Phone, Users } from "lucide-react";
import { Gallery, SourceFiles } from "@/components/gallery";
import { buttonVariants } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AMENITIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { MenuPackage, Restaurant } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

type Params = Promise<{ id: string }>;

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle<Restaurant>();
  if (!restaurant) return null;
  const { data: packages } = await supabase
    .from("menu_packages")
    .select("*")
    .eq("restaurant_id", id)
    .eq("is_verified", true)
    .order("price_per_person", { ascending: true })
    .returns<MenuPackage[]>();
  return { restaurant, packages: packages ?? [] };
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

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{r.name}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {r.district}, {r.address}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" /> {r.capacity} хүний багтаамж
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {AMENITIES.filter((a) => r[a.key]).map((a) => (
            <Badge key={a.key}>{a.label}</Badge>
          ))}
        </div>
        {r.description && <p className="max-w-3xl whitespace-pre-line">{r.description}</p>}
      </header>

      <Gallery images={r.images} name={r.name} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Шинэ жилийн багцууд</h2>
        {packages.length === 0 && <p className="text-muted-foreground">Баталгаажсан багц одоогоор алга.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.package_name}</CardTitle>
                <p>
                  <span className="text-2xl font-bold text-primary">{formatMNT(p.price_per_person)}</span>
                  <span className="text-muted-foreground"> / 1 хүн</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Нийт {formatMNT(p.total_price)} · {p.person_count} хүний
                </p>
              </CardHeader>
              {p.items.length > 0 && (
                <CardContent>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {p.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        <SourceFiles urls={sourceFiles} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Холбоо барих</h2>
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4" /> {r.phone}
          </p>
          <div>
            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={buttonVariants({ size: "lg" })}>
              <Phone className="h-4 w-4" /> Залгах
            </a>
          </div>
        </div>
        <iframe src={mapSrc} title="Байршил" className="h-64 w-full rounded-lg border" loading="lazy" />
      </section>
    </div>
  );
}

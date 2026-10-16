import Link from "next/link";
import { ArrowUpRight, BadgeCheck, FileUp, SearchX, Sparkles } from "lucide-react";
import { Filters, type FilterValues } from "@/components/filters";
import { RestaurantCard } from "@/components/restaurant-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Divider, Section } from "@/components/ui/frame";
import { AMENITIES, BUDGET_MAX, BUDGET_MIN, CAPACITY_RANGES, CITIES, DISTRICTS, UB } from "@/lib/constants";
import { getFeaturedRestaurants, getSiteStats, searchRestaurants } from "@/lib/queries";
import type { RestaurantSearchRow } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const city = (CITIES as readonly string[]).includes(one(sp.city) ?? "") ? one(sp.city) : undefined;
  // Дүүргээр зөвхөн Улаанбаатарт шүүнэ.
  const district =
    (!city || city === UB) && (DISTRICTS as readonly string[]).includes(one(sp.district) ?? "") ? one(sp.district) : undefined;
  const minPrice = num(one(sp.min));
  const maxPrice = num(one(sp.max));
  const capacity = CAPACITY_RANGES.find((c) => c.key === one(sp.capacity));
  const amenities = AMENITIES.filter((a) => one(sp[a.key]) === "1").map((a) => a.key);

  let results: RestaurantSearchRow[] = [];
  let error = false;
  try {
    results = await searchRestaurants({
      city: city ?? (district ? UB : undefined),
      district,
      minPrice,
      maxPrice,
      minCapacity: capacity?.min,
      maxCapacity: capacity?.max,
      hasHost: amenities.includes("has_host"),
      hasStage: amenities.includes("has_stage"),
      hasScreen: amenities.includes("has_screen"),
      hasParking: amenities.includes("has_parking"),
    });
  } catch (err) {
    console.error("search failed", err);
    error = true;
  }

  const initial: FilterValues = {
    city,
    district,
    minPrice: minPrice ?? BUDGET_MIN,
    maxPrice: maxPrice ?? BUDGET_MAX,
    capacity: capacity?.key,
    amenities,
  };

  const [stats, featured] = await Promise.all([
    getSiteStats().catch(() => null),
    getFeaturedRestaurants().catch(() => []),
  ]);

  return (
    <>
      <Section className="hero-glow py-16 text-center sm:py-24">
        {stats && stats.restaurants > 0 && (
          <div className="mx-auto inline-flex items-center justify-center divide-x rounded-full border bg-card px-1 py-1.5 text-xs sm:px-2 sm:text-sm text-muted-foreground shadow-sm">
            <span className="px-2 sm:px-3">
              <b className="font-semibold text-foreground">{stats.restaurants}</b> ресторан
            </span>
            <span className="px-2 sm:px-3">
              <b className="font-semibold text-foreground">{stats.packages}</b> багц
            </span>
            <span className="px-2 sm:px-3">
              <b className="font-semibold text-foreground">{stats.districts}</b> дүүрэг
            </span>
            {stats.min_price != null && (
              <span className="px-2 sm:px-3">
                <b className="font-semibold text-foreground">{formatMNT(stats.min_price)}</b>-өөс
              </span>
            )}
          </div>
        )}
        <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-[-0.035em] sm:text-6xl">
          Шинэ жилийн хүлээн авалтаа
          <br />
          <span className="text-gradient">1 хүний үнээр сонго</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-foreground/75 sm:text-lg">
          Ресторануудын багцыг байршил, заалны багтаамж, хөтлөгч, тайзаар шүүж — багцын нийт үнэ биш, нэг хүнд ногдох
          бодит үнээр нь харьцуулаарай.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#results" className={buttonVariants({ variant: "dark", size: "lg" })}>
            Ресторан хайх
          </a>
          <Link href="/dashboard/new" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Ресторанаа нэмэх <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
              {featured.length >= 3 && (
          <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 lg:h-[420px] lg:grid-cols-4 lg:grid-rows-2">
            {featured.slice(0, 5).map((f, i) => (
              <Link
                key={f.id}
                href={`/restaurants/${f.id}`}
                className={`group relative overflow-hidden rounded-2xl border bg-muted shadow-sm lg:aspect-auto ${
                  i === 0 ? "col-span-2 aspect-[16/10] lg:row-span-2" : "aspect-[4/3]"
                } ${i >= 3 ? "hidden lg:block" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.image} alt={f.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-90" />
                <span className="absolute bottom-2 left-3 right-3 truncate text-left text-sm font-semibold text-white drop-shadow">
                  {f.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Divider />

      <Section id="results" className="scroll-mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ресторанууд</h2>
            <p className="mt-1 text-muted-foreground">1 хүний хамгийн бага үнээр эрэмбэлсэн.</p>
          </div>
          <p className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
            {error ? "Хайлт хийхэд алдаа гарлаа" : `${results.length} ресторан олдлоо`}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            {/* URL өөрчлөгдөхөд (жишээ нь "Цэвэрлэх") талбаруудыг шинэ утгаар дахин үүсгэнэ. */}
            <Filters key={JSON.stringify(initial)} initial={initial} />
          </aside>
          <div>
            {!error && results.length === 0 ? (
              <Empty className="rounded-xl border border-dashed bg-card py-14">
                <EmptyHeader className="mb-0">
                  <EmptyMedia variant="icon">
                    <SearchX />
                  </EmptyMedia>
                  <EmptyTitle>Тохирох ресторан олдсонгүй</EmptyTitle>
                  <EmptyDescription>Шүүлтүүрээ өөрчилж эсвэл төсвөө нэмж үзээрэй.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((r) => (
                  <RestaurantCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Divider />

      <Section id="how" className="scroll-mt-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Хэрхэн ажилладаг</h2>
        <p className="mt-1 text-muted-foreground">Ресторан цэсээ оруулахад үлдсэнийг нь систем хийнэ.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOW_STEPS.map((step, i) => (
            <div key={step.title} className="rounded-xl border bg-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand [&_svg]:h-5 [&_svg]:w-5">
                  {step.icon}
                </span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

const HOW_STEPS = [
  {
    icon: <FileUp />,
    title: "Ресторан цэсээ байршуулна",
    text: "PDF эсвэл зураг хэлбэрээр Шинэ жилийн цэсээ оруулна. Хэлбэр, загвар хамаагүй.",
  },
  {
    icon: <Sparkles />,
    title: "AI багц бүрийг задлана",
    text: "Gemini багцын нэр, нийт үнэ, хүний тоо, хоолны жагсаалтыг гаргаж 1 хүний үнийг тооцно.",
  },
  {
    icon: <BadgeCheck />,
    title: "Баталгаажсаны дараа нийтлэгдэнэ",
    text: "Менежер шалгаж засаад баталгаажуулна. Та бодит үнээр нь харьцуулж сонгоно.",
  },
];

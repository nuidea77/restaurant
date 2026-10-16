import { Filters, type FilterValues } from "@/components/filters";
import { RestaurantCard } from "@/components/restaurant-card";
import { AMENITIES, BUDGET_MAX, BUDGET_MIN, CAPACITY_RANGES, DISTRICTS } from "@/lib/constants";
import { searchRestaurants } from "@/lib/queries";
import type { RestaurantSearchRow } from "@/lib/types";

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

  const district = (DISTRICTS as readonly string[]).includes(one(sp.district) ?? "") ? one(sp.district) : undefined;
  const minPrice = num(one(sp.min));
  const maxPrice = num(one(sp.max));
  const capacity = CAPACITY_RANGES.find((c) => c.key === one(sp.capacity));
  const amenities = AMENITIES.filter((a) => one(sp[a.key]) === "1").map((a) => a.key);

  let results: RestaurantSearchRow[] = [];
  let error = false;
  try {
    results = await searchRestaurants({
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
    district,
    minPrice: minPrice ?? BUDGET_MIN,
    maxPrice: maxPrice ?? BUDGET_MAX,
    capacity: capacity?.key,
    amenities,
  };

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">Шинэ жилийн хүлээн авалтын ресторан хайх</h1>
        <p className="text-muted-foreground">Багцын нийт үнэ биш — 1 хүнд ногдох бодит үнээр харьцуулаарай.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <Filters initial={initial} />
        </aside>
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error ? "Хайлт хийхэд алдаа гарлаа. Дахин оролдоно уу." : `${results.length} ресторан олдлоо`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((r) => (
              <RestaurantCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

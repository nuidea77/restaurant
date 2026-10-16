import "server-only";
import { sql } from "@/lib/db";
import type { MenuPackage, OwnerRestaurant, Restaurant, RestaurantSearchRow } from "@/lib/types";


export type SearchFilters = {
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number | null;
  maxCapacity?: number | null;
  hasHost?: boolean;
  hasStage?: boolean;
  hasScreen?: boolean;
  hasParking?: boolean;
  /** "YYYY-MM-DD" — тухайн өдөр захиалга авдаг ресторан. */
  date?: string;
};

/** Баталгаажсан багцтай ресторануудыг 1 хүний үнэ, багтаамж, дүүрэг, нөхцөлөөр шүүнэ. */
export function searchRestaurants(f: SearchFilters) {
  return sql<RestaurantSearchRow>`
    select r.id, r.name, r.city, r.district, r.address, r.phone, r.capacity,
           r.has_host, r.has_stage, r.has_screen, r.has_parking, r.images,
           min(p.price_per_person)::float8 as min_price,
           max(p.price_per_person)::float8 as max_price,
           count(p.id)::int as package_count
    from restaurants r
    join menu_packages p
      on p.restaurant_id = r.id
     and p.is_verified
     and (${f.minPrice ?? null}::numeric is null or p.price_per_person >= ${f.minPrice ?? null}::numeric)
     and (${f.maxPrice ?? null}::numeric is null or p.price_per_person <= ${f.maxPrice ?? null}::numeric)
    where r.is_paid
      and (${f.city ?? null}::text is null or r.city = ${f.city ?? null}::text)
      and (${f.district ?? null}::text is null or r.district = ${f.district ?? null}::text)
      and (${f.minCapacity ?? null}::int is null or r.capacity >= ${f.minCapacity ?? null}::int)
      and (${f.maxCapacity ?? null}::int is null or r.capacity <= ${f.maxCapacity ?? null}::int)
      and (${!!f.hasHost} = false or r.has_host)
      and (${!!f.hasStage} = false or r.has_stage)
      and (${!!f.hasScreen} = false or r.has_screen)
      and (${!!f.hasParking} = false or r.has_parking)
      and (${f.date ?? null}::date is null or ${f.date ?? null}::date = any(r.available_dates))
    group by r.id
    order by min(p.price_per_person) asc`;
}

// available_dates (date[])-г цагийн бүсгүй "YYYY-MM-DD" мөрийн массив болгож `dates` нэрээр буцаана.

/** Нийтийн хуудас — зөвхөн төлбөр төлөгдсөн ресторан. */
export async function getRestaurant(id: string) {
  const [r] = await sql<Restaurant>`select r.*, coalesce(array(select to_char(d, 'YYYY-MM-DD') from unnest(r.available_dates) d order by d), '{}') as dates from restaurants r where r.id = ${id} and r.is_paid`;
  return r ?? null;
}

/** Эзэмшигчийн өөрийн ресторан (төлбөрийн төлөвөөс үл хамааран). */
export async function getOwnedRestaurant(id: string, ownerId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [r] = await sql<Restaurant>`select r.*, coalesce(array(select to_char(d, 'YYYY-MM-DD') from unnest(r.available_dates) d order by d), '{}') as dates from restaurants r where r.id = ${id} and r.owner_id = ${ownerId}`;
  return r ?? null;
}

export function getOwnerRestaurants(ownerId: string) {
  return sql<OwnerRestaurant>`
    select r.*, coalesce(array(select to_char(d, 'YYYY-MM-DD') from unnest(r.available_dates) d order by d), '{}') as dates,
           count(p.id)::int as package_count,
           count(p.id) filter (where not p.is_verified)::int as pending_count
    from restaurants r
    left join menu_packages p on p.restaurant_id = r.id
    where r.owner_id = ${ownerId}
    group by r.id
    order by r.created_at desc`;
}

/** verifiedOnly=false нь зөвхөн эзэмшигчийн самбарт. */
export function getPackages(restaurantId: string, verifiedOnly: boolean) {
  return sql<MenuPackage>`
    select id, restaurant_id, package_name, file_url, items, is_verified, created_at, person_count,
           total_price::float8 as total_price, price_per_person::float8 as price_per_person
    from menu_packages
    where restaurant_id = ${restaurantId} and (${!verifiedOnly} or is_verified)
    order by is_verified asc, price_per_person asc, created_at desc`;
}

/** Hero хэсгийн тоон үзүүлэлт — зөвхөн баталгаажсан багцтай ресторанууд. */
export async function getSiteStats() {
  const [row] = await sql<{ restaurants: number; packages: number; districts: number; min_price: number | null }>`
    select count(distinct r.id)::int as restaurants,
           count(p.id)::int as packages,
           count(distinct r.district)::int as districts,
           min(p.price_per_person)::float8 as min_price
    from restaurants r
    join menu_packages p on p.restaurant_id = r.id and p.is_verified
    where r.is_paid`;
  return row;
}

/** Нүүр хуудасны коллажид — зурагтай, нийтлэгдсэн ресторанууд. */
export function getFeaturedRestaurants(limit = 5) {
  return sql<{ id: string; name: string; image: string; district: string; city: string }>`
    select r.id, r.name, r.images[1] as image, r.district, r.city
    from restaurants r
    where r.is_paid and coalesce(array_length(r.images, 1), 0) > 0
      and exists (select 1 from menu_packages p where p.restaurant_id = r.id and p.is_verified)
    order by r.capacity desc
    limit ${limit}`;
}

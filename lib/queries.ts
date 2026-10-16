import "server-only";
import { sql } from "@/lib/db";
import type { MenuPackage, Restaurant, RestaurantSearchRow } from "@/lib/types";


export type SearchFilters = {
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number | null;
  maxCapacity?: number | null;
  hasHost?: boolean;
  hasStage?: boolean;
  hasScreen?: boolean;
  hasParking?: boolean;
};

/** Баталгаажсан багцтай ресторануудыг 1 хүний үнэ, багтаамж, дүүрэг, нөхцөлөөр шүүнэ. */
export function searchRestaurants(f: SearchFilters) {
  return sql<RestaurantSearchRow>`
    select r.id, r.name, r.district, r.address, r.phone, r.capacity,
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
    where (${f.district ?? null}::text is null or r.district = ${f.district ?? null}::text)
      and (${f.minCapacity ?? null}::int is null or r.capacity >= ${f.minCapacity ?? null}::int)
      and (${f.maxCapacity ?? null}::int is null or r.capacity <= ${f.maxCapacity ?? null}::int)
      and (${!!f.hasHost} = false or r.has_host)
      and (${!!f.hasStage} = false or r.has_stage)
      and (${!!f.hasScreen} = false or r.has_screen)
      and (${!!f.hasParking} = false or r.has_parking)
    group by r.id
    order by min(p.price_per_person) asc`;
}

export async function getRestaurant(id: string) {
  const [r] = await sql<Restaurant>`select * from restaurants where id = ${id}`;
  return r ?? null;
}

export async function getRestaurantByOwner(ownerId: string) {
  const [r] = await sql<Restaurant>`select * from restaurants where owner_id = ${ownerId}`;
  return r ?? null;
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

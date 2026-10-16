// Демо өгөгдөл оруулах нийтлэг логик — `npm run seed` болон апп анх асахад (lib/db.ts) ашиглана.
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_RESTAURANTS } from "./demo-data.mjs";

/** @param {import("@electric-sql/pglite").PGlite} db */
export async function seedDemo(db, log = () => {}) {
  await db.sql`delete from users where email like '%@demo.mn'`;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const [i, r] of DEMO_RESTAURANTS.entries()) {
    const n = i + 1;
    const [{ id: userId }] = (await db.sql`
      insert into users (email, password_hash) values (${`demo${n}@demo.mn`}, ${hash}) returning id`).rows;
    const images = [`/demo/r${n}-1.svg`, `/demo/r${n}-2.svg`];
    const [{ id: restaurantId }] = (await db.sql`
      insert into restaurants (owner_id, name, district, address, phone, capacity, description,
        has_host, has_stage, has_screen, has_parking, latitude, longitude, images)
      values (${userId}, ${r.name}, ${r.district}, ${r.address}, ${r.phone}, ${r.capacity}, ${r.description},
        ${r.host}, ${r.stage}, ${r.screen}, ${r.parking}, ${r.lat}, ${r.lng}, ${images})
      returning id`).rows;

    for (const p of r.packages) {
      // price_per_person-ийг trigger тооцно.
      await db.sql`
        insert into menu_packages (restaurant_id, package_name, file_url, total_price, person_count, price_per_person, items, is_verified)
        values (${restaurantId}, ${p.name}, ${`/demo/r${n}-menu.svg`}, ${p.total}, ${p.count}, 0, ${JSON.stringify(p.items)}::jsonb, true)`;
    }
    log(`✓ ${r.name} (${r.packages.length} багц) — нэвтрэх: demo${n}@demo.mn`);
  }
  return { count: DEMO_RESTAURANTS.length, password: DEMO_PASSWORD };
}

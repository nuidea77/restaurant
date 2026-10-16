// Демо өгөгдөл оруулах нийтлэг логик — `npm run seed` болон апп анх асахад (lib/db.ts) ашиглана.
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_RESTAURANTS } from "./demo-data.mjs";

/** Демо эзэмшигчийн утас: 80000001 … 80000010 (баталгаажсан, SMS илгээгдэхгүй). */
export const demoPhone = (n) => String(80000000 + n);

/** Демо рестораны захиалга авах өдрүүд: энэ оны 12-р сарын 10–31 (зарим өдөр нь "дүүрсэн"). */
export function demoDates(n, now = new Date()) {
  const y = now.getUTCFullYear();
  const dates = [];
  for (let d = 10; d <= 31; d++) if ((d + n) % 4 !== 0) dates.push(`${y}-12-${String(d).padStart(2, "0")}`);
  return dates;
}

/** @param {{ sql: (s: TemplateStringsArray, ...v: unknown[]) => Promise<{ rows: any[] }> }} db */
export async function seedDemo(db, log = () => {}) {
  await db.sql`delete from users where email like '%@demo.mn'`;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const [i, r] of DEMO_RESTAURANTS.entries()) {
    const n = i + 1;
    const [{ id: userId }] = (await db.sql`
      insert into users (email, phone, phone_verified_at, password_hash)
      values (${`demo${n}@demo.mn`}, ${demoPhone(n)}, now(), ${hash}) returning id`).rows;
    const images = [`/demo/r${n}-1.jpg`, `/demo/r${n}-2.jpg`];
    const [{ id: restaurantId }] = (await db.sql`
      insert into restaurants (owner_id, name, district, address, phone, capacity, description,
        has_host, has_stage, has_screen, has_parking, latitude, longitude, images, available_dates, is_paid, paid_at)
      values (${userId}, ${r.name}, ${r.district}, ${r.address}, ${r.phone}, ${r.capacity}, ${r.description},
        ${r.host}, ${r.stage}, ${r.screen}, ${r.parking}, ${r.lat}, ${r.lng}, ${images}, ${demoDates(n)}::date[], true, now())
      returning id`).rows;

    for (const p of r.packages) {
      // price_per_person-ийг trigger тооцно.
      await db.sql`
        insert into menu_packages (restaurant_id, package_name, file_url, total_price, person_count, price_per_person, items, is_verified)
        values (${restaurantId}, ${p.name}, ${`/demo/r${n}-menu.svg`}, ${p.total}, ${p.count}, 0, ${JSON.stringify(p.items)}::jsonb, true)`;
    }
    log(`✓ ${r.name} (${r.packages.length} багц) — нэвтрэх: ${demoPhone(n)}`);
  }
  return { count: DEMO_RESTAURANTS.length, password: DEMO_PASSWORD };
}

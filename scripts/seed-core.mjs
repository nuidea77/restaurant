// Демо өгөгдөл оруулах нийтлэг логик — `npm run seed` болон апп анх асахад (lib/db.ts) ашиглана.
import bcrypt from "bcryptjs";
import { DEMO_EVENTS, DEMO_PASSWORD, DEMO_RESTAURANTS, DEMO_VENUE_TYPES } from "./demo-data.mjs";

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
      insert into restaurants (owner_id, name, venue_type, district, address, phone, capacity, description,
        has_host, has_stage, has_screen, has_parking, latitude, longitude, images, available_dates, is_paid, paid_at)
      values (${userId}, ${r.name}, ${DEMO_VENUE_TYPES[n] ?? "restaurant"}, ${r.district}, ${r.address}, ${r.phone}, ${r.capacity}, ${r.description},
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
  await seedDemoEvents(db);
  return { count: DEMO_RESTAURANTS.length, password: DEMO_PASSWORD };
}

/**
 * Демо газруудад эвент болон төрлийг оруулна (өмнө seed хийгдсэн өгөгдлийн санд ч). Эвент аль хэдийн байвал алгасна.
 * @param {{ sql: (s: TemplateStringsArray, ...v: unknown[]) => Promise<{ rows: any[] }> }} db
 */
export async function seedDemoEvents(db, now = new Date()) {
  const { rows } = await db.sql`
    select r.id, u.email, (select count(*) from events e where e.restaurant_id = r.id)::int as n_events
    from restaurants r join users u on u.id = r.owner_id where u.email like 'demo%@demo.mn'`;
  const byN = new Map(rows.map((r) => [Number(/^demo(\d+)@/.exec(r.email)?.[1]), r]));
  if (rows.some((r) => r.n_events > 0)) return 0;

  for (const [n, type] of Object.entries(DEMO_VENUE_TYPES)) {
    const r = byN.get(Number(n));
    if (r) await db.sql`update restaurants set venue_type = ${type} where id = ${r.id} and venue_type = 'restaurant'`;
  }
  const y = now.getUTCFullYear();
  let count = 0;
  for (const e of DEMO_EVENTS) {
    const r = byN.get(e.venue);
    if (!r) continue;
    await db.sql`
      insert into events (restaurant_id, title, event_date, start_time, artists, capacity, ticket_price, items, description)
      values (${r.id}, ${e.title}, ${`${y}-12-${e.day}`}::date, ${e.time}, ${e.artists}, ${e.capacity}, ${e.price},
        ${e.items}, ${e.description})`;
    count++;
  }
  return count;
}

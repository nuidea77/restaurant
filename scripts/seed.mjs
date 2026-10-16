// 10 демо ресторан оруулна. Хэрэглээ: серверийг зогсоогоод `npm run seed`
// Дахин ажиллуулахад өмнөх демо өгөгдлийг (@demo.mn хэрэглэгчид) устгаад шинээр үүсгэнэ.
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_RESTAURANTS } from "./demo-data.mjs";

const port = process.env.PORT || 3000;
const running = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(1000) }).then(() => true, () => false);
if (running) {
  console.error(`Сервер localhost:${port} дээр ажиллаж байна. Эхлээд түүнийг зогсооно уу (Ctrl+C), дараа нь дахин ажиллуулна.`);
  process.exit(1);
}

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
mkdirSync(path.join(dataDir, "pgdata"), { recursive: true });
const db = await PGlite.create(path.join(dataDir, "pgdata"));
await db.exec(readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));

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
  console.log(`✓ ${r.name} (${r.packages.length} багц) — нэвтрэх: demo${n}@demo.mn`);
}

await db.close();
console.log(`\n10 демо ресторан орлоо. Демо эзэмшигчийн нууц үг: ${DEMO_PASSWORD}`);

// db/schema.sql-г ажиллуулж, хоосон бол демо өгөгдөл оруулна. Idempotent тул build бүрт аюулгүй.
// Vercel дээр `npm run build`-ийн өмнө автоматаар ажиллана. Гараар: `npm run db:migrate`.
import { readFile } from "node:fs/promises";
import { connect, findDatabaseUrl } from "./neon-node.mjs";
import { seedDemo } from "./seed-core.mjs";

const url = findDatabaseUrl();
if (!url) {
  console.warn("[migrate] DATABASE_URL тохируулаагүй тул алгаслаа (Vercel → Storage → Neon холбоно уу)");
  process.exit(0);
}

const db = connect(url);
await db.exec(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("[migrate] Схем бэлэн");

// Хуучин демо SVG зургуудыг бодит JPG зургаар солино (өмнө нь seed хийгдсэн өгөгдлийн санд).
await db.sql`
  update restaurants
  set images = array(select regexp_replace(x, '^/demo/(r[0-9]+-[12])\\.svg$', '/demo/\\1.jpg') from unnest(images) x)
  where images::text ~ '/demo/r[0-9]+-[12]\\.svg'`;

if (process.env.DEMO_DATA !== "false") {
  const { rows } = await db.sql`select count(*)::int as n from restaurants`;
  if (rows[0].n === 0) {
    const { count } = await seedDemo(db);
    console.log(`[migrate] Өгөгдлийн сан хоосон байсан тул ${count} демо ресторан орууллаа`);
  }
}

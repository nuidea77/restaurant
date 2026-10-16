// db/schema.sql-г ажиллуулна. Схем idempotent тул build бүрт ажиллуулахад аюулгүй.
// Хэрэглээ: npm run db:migrate  (Vercel дээр build-ийн өмнө автоматаар ажиллана)
import { readFile } from "node:fs/promises";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL тохируулаагүй тул схем үүсгэхийг алгаслаа");
  process.exit(0);
}

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const pool = new Pool({ connectionString: url });
try {
  await pool.query(sql);
  console.log("[migrate] Схем бэлэн");
} finally {
  await pool.end();
}

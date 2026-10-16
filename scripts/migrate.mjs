// Хэрэглээ: node --env-file=.env.local scripts/migrate.mjs
import { readFile } from "node:fs/promises";
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL тохируулаагүй байна");
  process.exit(1);
}

const sql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(sql);
await pool.end();
console.log("Схем амжилттай үүслээ");

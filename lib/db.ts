import "server-only";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { seedDemo } from "@/scripts/seed-core.mjs";

/** Бүх локал өгөгдөл (DB, байршуулсан файл) энд хадгалагдана. */
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

type DbState = { ready: Promise<PGlite> };
const g = globalThis as typeof globalThis & { __restaurantDb?: DbState };

// Postgres-ийг WASM хэлбэрээр процесс дотор ажиллуулна — суулгах сервер хэрэггүй.
// Dev hot-reload үед дахин нээгдэхгүйн тулд globalThis дээр нэг л удаа үүсгэнэ.
function getDb() {
  if (!g.__restaurantDb) {
    g.__restaurantDb = {
      ready: (async () => {
        const dir = path.join(DATA_DIR, "pgdata");
        mkdirSync(dir, { recursive: true });
        const db = await PGlite.create(dir);
        await db.exec(readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
        // Анх асаахад (ресторан нэг ч байхгүй үед) демо өгөгдөл оруулна. DEMO_DATA=false бол алгасна.
        if (process.env.DEMO_DATA !== "false") {
          const { rows } = await db.query<{ n: number }>("select count(*)::int as n from restaurants");
          if (rows[0].n === 0) await seedDemo(db);
        }
        return db;
      })(),
    };
  }
  return g.__restaurantDb.ready;
}

export async function sql<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  const db = await getDb();
  const result = await db.sql<T>(strings, ...values);
  return result.rows;
}

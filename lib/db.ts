import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { databaseUrl } from "@/lib/env";

let client: ReturnType<typeof neon> | null = null;

// Зөвхөн тест: локал Postgres-ийн өмнө ажиллах Neon прокси (local-neon-http-proxy). Production-д тохируулахгүй.
if (process.env.NEON_LOCAL_PROXY) {
  neonConfig.fetchEndpoint = (host) => `http://${host}:${process.env.NEON_LOCAL_PROXY}/sql`;
}

/**
 * Vercel Postgres (Neon) — HTTP драйвер, serverless функцэд холболт үүсгэх зардалгүй.
 * Схем болон демо өгөгдлийг build-ийн өмнө scripts/migrate.mjs үүсгэнэ.
 */
export function sql<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  if (!client) {
    const url = databaseUrl();
    if (!url) throw new Error("DATABASE_URL тохируулаагүй байна");
    client = neon(url);
  }
  return client(strings, ...values) as Promise<T[]>;
}

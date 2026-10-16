import "server-only";
import { neon } from "@neondatabase/serverless";
import { databaseUrl } from "@/lib/env";

let client: ReturnType<typeof neon> | null = null;

/** Vercel Postgres (Neon) — HTTP драйвер, serverless функцэд холболт үүсгэх зардалгүй. */
export function sql<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  if (!client) {
    const url = databaseUrl();
    if (!url) throw new Error("DATABASE_URL тохируулаагүй байна");
    client = neon(url);
  }
  return client(strings, ...values) as Promise<T[]>;
}

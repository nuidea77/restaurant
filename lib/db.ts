import "server-only";
import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

/** Vercel Postgres (Neon) — HTTP драйвер, serverless функцэд холболт үүсгэх зардалгүй. */
export function sql<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL тохируулаагүй байна");
    client = neon(process.env.DATABASE_URL);
  }
  return client(strings, ...values) as Promise<T[]>;
}

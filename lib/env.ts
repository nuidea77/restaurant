import "server-only";

export function databaseUrl() {
  // Neon integration DATABASE_URL, хуучин Vercel Postgres POSTGRES_URL үүсгэдэг.
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

/** Апп ажиллахад заавал шаардлагатай ч тохируулаагүй орчны хувьсагчдын нэр. */
export function missingRequiredEnv() {
  const missing: string[] = [];
  if (!databaseUrl()) missing.push("DATABASE_URL");
  if (!process.env.AUTH_SECRET) missing.push("AUTH_SECRET");
  return missing;
}

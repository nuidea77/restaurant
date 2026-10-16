import "server-only";
import { createHash } from "node:crypto";

/**
 * Өгөгдлийн сангийн холболт. Neon integration-ийг custom prefix-тэй холбовол
 * STORAGE_DATABASE_URL, NEON_POSTGRES_URL гэх мэт нэртэй үүсдэг тул бүгдийг хайна.
 */
export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  const key = Object.keys(process.env)
    .sort()
    .find((k) => /(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(k) && process.env[k]?.startsWith("postgres"));
  return key ? process.env[key] : undefined;
}

/**
 * Auth.js-ийн нууц түлхүүр. AUTH_SECRET тохируулаагүй бол DB холболтын мөрөөс (зөвхөн серверт мэдэгдэх
 * нууц үгтэй) тогтвортой түлхүүр үүсгэнэ — тусдаа AUTH_SECRET тохируулахыг зөвлөнө.
 */
export function authSecret() {
  const explicit = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (explicit) return explicit;
  const db = databaseUrl();
  return db ? createHash("sha256").update(`authjs-secret:${db}`).digest("base64") : undefined;
}

/** Апп ажиллахад заавал шаардлагатай ч тохируулаагүй орчны хувьсагчдын нэр. */
export function missingRequiredEnv() {
  return databaseUrl() ? [] : ["DATABASE_URL"];
}

/** Тохиргооны хуудсанд харуулах оношилгоо — зөвхөн нэр, утгыг хэзээ ч биш. */
export function envDiagnostics() {
  return {
    vercelEnv: process.env.VERCEL_ENV ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    relatedKeys: Object.keys(process.env)
      .filter((k) => /^(AUTH_|NEXTAUTH_|BLOB_|VERTEX_|GEMINI_|NEON_|BYL_|VERIFY_MN_|PG)|DATABASE_URL|POSTGRES_/.test(k))
      .sort(),
  };
}

import "server-only";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DATA_DIR } from "@/lib/db";

/**
 * Auth.js-ийн нууц түлхүүр. AUTH_SECRET тохируулаагүй бол анх ажиллахад санамсаргүй түлхүүр үүсгэж
 * data/.auth-secret файлд хадгална — дахин асаахад нэвтрэлт хадгалагдана.
 */
export function authSecret() {
  const explicit = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (explicit) return explicit;
  const file = path.join(DATA_DIR, ".auth-secret");
  if (!existsSync(file)) {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(file, randomBytes(32).toString("base64"));
  }
  return readFileSync(file, "utf8").trim();
}

import type { PGlite } from "@electric-sql/pglite";

export function seedDemo(db: PGlite, log?: (msg: string) => void): Promise<{ count: number; password: string }>;

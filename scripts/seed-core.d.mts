export type SeedDb = {
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export const demoPhone: (n: number) => string;
export function seedDemo(db: SeedDb, log?: (msg: string) => void): Promise<{ count: number; password: string }>;

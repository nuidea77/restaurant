export type ExtractedPackage = {
  package_name: string;
  total_price: number;
  person_count: number;
  price_per_person: number;
  items: string[];
};

/** "1,500,000₮", "1 500 000", 1500000 → 1500000. Төгрөг тул бүхэл тоогоор авна. */
export function parseMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function parsePersonCount(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 1;
}

export function pricePerPerson(total: number, personCount: number) {
  return Math.round(total / Math.max(1, personCount));
}

/**
 * AI-аас ирсэн түүхий багцыг цэвэрлэж, 1 хүний үнийг дахин тооцно.
 * Нийт үнэ байхгүй ч 1 хүний үнэ байвал нийт үнийг сэргээнэ. Үнэгүй багцыг хасна.
 */
export function normalizePackage(raw: unknown): ExtractedPackage | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const person_count = parsePersonCount(r.person_count);
  let total_price = parseMoney(r.total_price);
  const perPerson = parseMoney(r.price_per_person);
  if (!total_price && perPerson) total_price = perPerson * person_count;
  if (!total_price) return null;

  const name = typeof r.package_name === "string" ? r.package_name.trim() : "";
  const items = Array.isArray(r.items)
    ? r.items.map((i) => (typeof i === "string" ? i.trim() : "")).filter(Boolean)
    : [];

  return {
    package_name: name || "Нэргүй багц",
    total_price,
    person_count,
    price_per_person: pricePerPerson(total_price, person_count),
    items,
  };
}

export function normalizePackages(raw: unknown): ExtractedPackage[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { packages?: unknown }).packages)
      ? (raw as { packages: unknown[] }).packages
      : [];
  return list.map(normalizePackage).filter((p): p is ExtractedPackage => p !== null);
}

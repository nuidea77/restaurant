// Огноог "YYYY-MM-DD" мөрөөр хадгална (цагийн бүсийн алдаанаас сэргийлнэ). Монголын цагаар (UTC+8) тооцно.
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"] as const;

export function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function todayISO() {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}

export function isValidISODate(s: string) {
  if (!ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** "2026-12-24" → "12-р сарын 24" */
export function formatDayMN(s: string, withWeekday = false) {
  const [y, m, d] = s.split("-").map(Number);
  const base = `${m}-р сарын ${d}`;
  if (!withWeekday) return base;
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return `${base} (${WEEKDAYS[wd]})`;
}

export function monthLabel(y: number, m: number) {
  return `${y} оны ${m + 1}-р сар`;
}

/** Сарын хуанлийн нүднүүд (Даваа гарагаас эхэлнэ). Хоосон нүд = null. */
export function monthCells(y: number, m: number): (string | null)[] {
  const first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(isoDate(y, m, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function addMonths(y: number, m: number, delta: number) {
  const t = y * 12 + m + delta;
  return { y: Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
}

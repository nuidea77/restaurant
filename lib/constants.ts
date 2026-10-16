export const DISTRICTS = [
  "Баянзүрх",
  "Баянгол",
  "Сүхбаатар",
  "Чингэлтэй",
  "Хан-Уул",
  "Сонгинохайрхан",
  "Налайх",
  "Багануур",
  "Багахангай",
] as const;

export const UB = "Улаанбаатар";

/** Хот, аймаг. Улаанбаатарт DISTRICTS-ээс сонгоно, бусад аймагт сум/хороог бичнэ. */
export const CITIES = [
  UB,
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорноговь",
  "Дорнод",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
] as const;

/** Газрын зургийн анхны төв (аймгийн төв). [өргөрөг, уртраг] */
export const CITY_CENTERS: Record<string, [number, number]> = {
  [UB]: [47.9185, 106.9177],
  Архангай: [47.4736, 101.4542],
  "Баян-Өлгий": [48.9686, 89.9625],
  Баянхонгор: [46.1944, 100.7181],
  Булган: [48.8125, 103.5347],
  "Говь-Алтай": [46.3722, 96.2583],
  Говьсүмбэр: [46.3597, 108.3714],
  "Дархан-Уул": [49.4867, 105.9228],
  Дорноговь: [44.8933, 110.1167],
  Дорнод: [48.0717, 114.5333],
  Дундговь: [45.7633, 106.2644],
  Завхан: [47.7347, 96.8481],
  Орхон: [49.0275, 104.0443],
  Өвөрхангай: [46.2667, 102.7833],
  Өмнөговь: [43.5667, 104.4167],
  Сүхбаатар: [46.6858, 113.2797],
  Сэлэнгэ: [50.2333, 106.2],
  Төв: [47.7069, 106.9531],
  Увс: [49.9811, 92.0667],
  Ховд: [48.0056, 91.6419],
  Хөвсгөл: [49.6342, 100.1625],
  Хэнтий: [47.3167, 110.65],
};

export const CAPACITY_RANGES = [
  { key: "50-100", label: "50–100 хүн", min: 50, max: 100 },
  { key: "100-250", label: "100–250 хүн", min: 100, max: 250 },
  { key: "250+", label: "250+ хүн", min: 250, max: null },
] as const;

export const AMENITIES = [
  { key: "has_host", label: "Хөтлөгчтэй" },
  { key: "has_stage", label: "Тайзтай" },
  { key: "has_screen", label: "Дэлгэцтэй" },
  { key: "has_parking", label: "Машины зогсоолтой" },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]["key"];

export const BUDGET_MIN = 0;
export const BUDGET_MAX = 500_000;
export const BUDGET_STEP = 5_000;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MENU_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Vercel Blob доторх хавтаснууд: <folder>/<user_id>/<file> */
export const UPLOAD_FOLDERS = {
  menus: MENU_MIME_TYPES,
  images: IMAGE_MIME_TYPES,
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

/** Нэг рестораныг нийтлэх төлбөр (₮). */
export const LISTING_FEE = 50_000;

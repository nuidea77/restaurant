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

/** data/uploads доторх хавтаснууд: <folder>/<user_id>/<file> */
export const UPLOAD_FOLDERS = {
  menus: MENU_MIME_TYPES,
  images: IMAGE_MIME_TYPES,
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

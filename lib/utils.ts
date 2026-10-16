import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMNT(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${Math.round(n).toLocaleString("en-US")}₮`;
}

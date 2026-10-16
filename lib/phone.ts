/** Монгол гар утасны дугаарыг 8 оронтой хэлбэрт оруулна: "+976 9911-2233" → "99112233". Буруу бол null. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  return /^[5-9]\d{7}$/.test(digits) ? digits : null;
}

/** "99112233" → "9911-2233" */
export function formatPhone(phone: string) {
  return /^\d{8}$/.test(phone) ? `${phone.slice(0, 4)}-${phone.slice(4)}` : phone;
}

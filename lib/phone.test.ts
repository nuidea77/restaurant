import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("accepts common Mongolian formats", () => {
    expect(normalizePhone("99112233")).toBe("99112233");
    expect(normalizePhone("9911 2233")).toBe("99112233");
    expect(normalizePhone("+976 8811-2233")).toBe("88112233");
    expect(normalizePhone("97699112233")).toBe("99112233");
  });
  it("rejects invalid numbers", () => {
    expect(normalizePhone("1234567")).toBeNull();
    expect(normalizePhone("123456789")).toBeNull();
    expect(normalizePhone("11223344")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
  it("formats for display", () => {
    expect(formatPhone("99112233")).toBe("9911-2233");
  });
});

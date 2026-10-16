import { describe, expect, it } from "vitest";
import { normalizePackage, normalizePackages, parseMoney } from "./pricing";

describe("parseMoney", () => {
  it("parses formatted MNT strings", () => {
    expect(parseMoney("1,500,000₮")).toBe(1500000);
    expect(parseMoney("100 000 төг")).toBe(100000);
    expect(parseMoney(85000)).toBe(85000);
    expect(parseMoney("үнэгүй")).toBeNull();
    expect(parseMoney(-5)).toBeNull();
  });
});

describe("normalizePackage", () => {
  it("handles a per-person package", () => {
    expect(normalizePackage({ package_name: "Стандарт", total_price: 100000, person_count: 1, items: ["Салат"] })).toEqual({
      package_name: "Стандарт",
      total_price: 100000,
      person_count: 1,
      price_per_person: 100000,
      items: ["Салат"],
    });
  });

  it("computes per-person price for a table package, ignoring AI's own math", () => {
    const p = normalizePackage({ package_name: "10 хүний ширээ", total_price: "1,500,000", person_count: 10, price_per_person: 999 });
    expect(p?.price_per_person).toBe(150000);
  });

  it("recovers total from per-person price", () => {
    const p = normalizePackage({ package_name: "VIP", price_per_person: 120000, person_count: 4 });
    expect(p?.total_price).toBe(480000);
  });

  it("defaults invalid person counts to 1 and drops priceless packages", () => {
    expect(normalizePackage({ package_name: "A", total_price: 50000, person_count: 0 })?.person_count).toBe(1);
    expect(normalizePackage({ package_name: "B" })).toBeNull();
  });
});

describe("normalizePackages", () => {
  it("accepts the {packages: []} envelope", () => {
    expect(normalizePackages({ packages: [{ package_name: "A", total_price: 1 }, null] })).toHaveLength(1);
    expect(normalizePackages("garbage")).toEqual([]);
  });
});

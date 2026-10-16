import { describe, expect, it } from "vitest";
import { isOwnBlobUrl } from "./blob";

const host = "https://abc123.public.blob.vercel-storage.com";

describe("isOwnBlobUrl", () => {
  it("accepts the user's own folder", () => {
    expect(isOwnBlobUrl(`${host}/menus/u1/menu-xyz.pdf`, "menus", "u1")).toBe(true);
  });
  it("rejects other users, folders and hosts", () => {
    expect(isOwnBlobUrl(`${host}/menus/u2/menu.pdf`, "menus", "u1")).toBe(false);
    expect(isOwnBlobUrl(`${host}/images/u1/a.png`, "menus", "u1")).toBe(false);
    expect(isOwnBlobUrl("https://evil.com/menus/u1/menu.pdf", "menus", "u1")).toBe(false);
    expect(isOwnBlobUrl("https://x.public.blob.vercel-storage.com.evil.com/menus/u1/a.pdf", "menus", "u1")).toBe(false);
    expect(isOwnBlobUrl("not a url", "menus", "u1")).toBe(false);
  });
});

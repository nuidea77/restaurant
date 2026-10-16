import { describe, expect, it } from "vitest";
import { isOwnUploadUrl } from "./upload-path";

describe("isOwnUploadUrl", () => {
  it("accepts the user's own folder", () => {
    expect(isOwnUploadUrl("/uploads/menus/u1/abc-123.pdf", "menus", "u1")).toBe(true);
  });
  it("rejects other users, folders, hosts and traversal", () => {
    expect(isOwnUploadUrl("/uploads/menus/u2/a.pdf", "menus", "u1")).toBe(false);
    expect(isOwnUploadUrl("/uploads/images/u1/a.png", "menus", "u1")).toBe(false);
    expect(isOwnUploadUrl("https://evil.com/uploads/menus/u1/a.pdf", "menus", "u1")).toBe(false);
    expect(isOwnUploadUrl("/uploads/menus/u1/../u2/a.pdf", "menus", "u1")).toBe(false);
    expect(isOwnUploadUrl("/uploads/menus/u1/sub/a.pdf", "menus", "u1")).toBe(false);
  });
});

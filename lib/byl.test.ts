import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { verifyWebhookSignature } = await import("./byl");

describe("verifyWebhookSignature", () => {
  const secret = "whsec_test";
  const body = '{"id":3,"type":"checkout.completed","data":{"object":{"id":13338}}}';
  const sig = createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a valid signature over the raw body", () => {
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });

  it("rejects tampered bodies, wrong secrets and missing headers", () => {
    expect(verifyWebhookSignature(body.replace("13338", "1"), sig, secret)).toBe(false);
    expect(verifyWebhookSignature(body, sig, "other")).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, "short", secret)).toBe(false);
  });
});

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { verifyWebhookSignature } from "@/lib/sms/security";

function signedHeaders(body: string, secret: string, timestamp: number): Headers {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return new Headers({
    "x-medconnect-timestamp": String(timestamp),
    "x-medconnect-signature": signature
  });
}

describe("verifyWebhookSignature", () => {
  it("accepts valid signatures", () => {
    vi.stubEnv("SMS_WEBHOOK_SECRET", "secret");
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ ping: true });
    const headers = signedHeaders(body, "secret", now);

    expect(verifyWebhookSignature(headers, body)).toBe(true);
    vi.unstubAllEnvs();
  });

  it("rejects invalid signatures", () => {
    vi.stubEnv("SMS_WEBHOOK_SECRET", "secret");
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ ping: true });
    const headers = new Headers({
      "x-medconnect-timestamp": String(now),
      "x-medconnect-signature": "0".repeat(64)
    });

    expect(verifyWebhookSignature(headers, body)).toBe(false);
    vi.unstubAllEnvs();
  });
});

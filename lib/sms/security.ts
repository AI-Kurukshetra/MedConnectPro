import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_HEADER = "x-medconnect-signature";
const TIMESTAMP_HEADER = "x-medconnect-timestamp";
const MAX_SKEW_SECONDS = 300;

function toBufferFromHex(hex: string): Buffer | null {
  if (!/^[a-f0-9]{64}$/i.test(hex)) {
    return null;
  }

  return Buffer.from(hex, "hex");
}

export function verifyWebhookSignature(headers: Headers, rawBody: string): boolean {
  const secret = process.env.SMS_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing SMS_WEBHOOK_SECRET environment variable.");
  }

  const signature = headers.get(SIGNATURE_HEADER);
  const timestamp = headers.get(TIMESTAMP_HEADER);

  if (!signature || !timestamp) {
    return false;
  }

  const timestampSeconds = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_SKEW_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  const received = toBufferFromHex(signature);
  if (!received || received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

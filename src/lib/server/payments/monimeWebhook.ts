/**
 * Monime webhook signature verify (roadmap 5.4 / FR-34).
 * Matches Monime HS256 header format: t=<unix>,v1=<base64 hmac>
 * Signed payload: `${timestamp}_${rawBody}` (see monimejs verifyWebhookSignature).
 * Do not import from client components.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_TOLERANCE_SEC = 300;

function fail(reason: string): never {
  const err = new Error(reason);
  err.name = "MonimeWebhookVerificationError";
  throw err;
}

/**
 * Parse `Monime-Signature: t=<unix>,v1=<base64>`
 */
function parseSignatureHeader(header: string): {
  timestampText: string;
  signature: Buffer;
} {
  if (typeof header !== "string") {
    fail("The Monime-Signature header is invalid.");
  }
  const parts = header.split(",");
  if (parts.length !== 2) {
    fail("The Monime-Signature header is invalid.");
  }
  const map = new Map<string, string>();
  for (const part of parts) {
    const eq = part.indexOf("=");
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key !== "t" && key !== "v1") {
      fail("The Monime-Signature header is invalid.");
    }
    map.set(key, value);
  }
  const timestampText = map.get("t");
  const v1 = map.get("v1");
  if (timestampText === undefined || v1 === undefined) {
    fail("The Monime-Signature header is invalid.");
  }
  if (!/^(0|[1-9]\d*)$/.test(timestampText) || !/^[A-Za-z0-9+/]+={0,2}$/.test(v1)) {
    fail("The Monime-Signature header is invalid.");
  }
  const timestamp = Number(timestampText);
  const signature = Buffer.from(v1, "base64");
  if (
    !Number.isSafeInteger(timestamp) ||
    signature.length !== 32 ||
    signature.toString("base64") !== v1
  ) {
    fail("The Monime-Signature header is invalid.");
  }
  return { timestampText, signature };
}

/**
 * Verify Monime webhook signature and return parsed JSON body.
 * @param rawBody Exact request body bytes/string
 * @param signatureHeader Value of Monime-Signature
 * @param secret HS256 shared secret (32–256 chars)
 */
export function verifyMonimeWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string
): Record<string, unknown> {
  if (typeof rawBody !== "string" && !Buffer.isBuffer(rawBody)) {
    throw new TypeError("rawBody must be a string or Buffer.");
  }
  if (typeof secret !== "string" || secret.length < 32) {
    throw new TypeError("webhookSecret must be a string at least 32 characters long.");
  }

  const { timestampText, signature } = parseSignatureHeader(signatureHeader);
  const ts = Number(timestampText);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_SEC) {
    fail("Webhook timestamp is outside the allowed range.");
  }

  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
  const signed = Buffer.concat([Buffer.from(`${timestampText}_`, "utf8"), bodyBuf]);
  const expected = createHmac("sha256", secret).update(signed).digest();
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(expected, signature)
  ) {
    fail("Webhook signature does not match.");
  }

  try {
    const parsed = JSON.parse(bodyBuf.toString("utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      fail("Webhook body is not valid JSON.");
    }
    return parsed as Record<string, unknown>;
  } catch {
    fail("Webhook body is not valid JSON.");
  }
}

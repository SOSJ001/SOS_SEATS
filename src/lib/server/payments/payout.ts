/**
 * Server-only Monime payouts. The only code path that sends money out.
 * Do not import from client components.
 */
import { randomUUID } from "crypto";
import { getMonimeCredentials } from "./monimeEnv";

const MONIME_API = "https://api.monime.io/v1";
const MONIME_VERSION = "caph.2025-08-23";

export const PAYOUT_PROVIDERS = {
  orange_money: "m17",
  afrimoney: "m18",
} as const;

export type PayoutProvider = keyof typeof PAYOUT_PROVIDERS;

export { formatSlPhone } from "$lib/slPhone";

function toStringMap(metadata: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  // Sorted so a retry with the same idempotency key sends a byte-identical body.
  for (const [key, value] of Object.entries(metadata).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (value === null || value === undefined) continue;
    out[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  return out;
}

export type SendPayoutResult =
  | { ok: true; payout: any }
  | { ok: false; error: string; status: number };

/**
 * Send `amountNle` (major units) to a mobile money number.
 * Retries only Monime's transient CROSSSLOT 500s. Pass a stored `idempotencyKey`
 * (with the same input) to retry a payout safely later; otherwise a new key is made.
 */
export async function sendPayout(input: {
  amountNle: number;
  provider: PayoutProvider;
  phone: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<SendPayoutResult> {
  const creds = getMonimeCredentials({ preferPayoutKey: true });
  if (!creds) {
    return { ok: false, error: "Monime API credentials not configured", status: 500 };
  }

  const body = {
    amount: { currency: "SLE", value: Math.round(input.amountNle * 100) },
    destination: {
      type: "momo",
      providerId: PAYOUT_PROVIDERS[input.provider],
      phoneNumber: input.phone,
    },
    metadata: toStringMap({ source: "sos_seats", ...(input.metadata || {}) }),
  };

  const idempotencyKey = input.idempotencyKey || randomUUID();
  let lastError: any = null;
  let lastStatus = 500;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
    const response = await fetch(`${MONIME_API}/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Content-Type": "application/json",
        "Monime-Space-Id": creds.spaceId,
        "Monime-Version": MONIME_VERSION,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const payload = await response.json();
      return { ok: true, payout: payload.result };
    }

    lastStatus = response.status;
    lastError = await response.json().catch(() => ({}));
    const message = lastError?.error?.message || lastError?.message || "";
    if (response.status !== 500 || !String(message).includes("CROSSSLOT")) break;
  }

  const message =
    lastError?.error?.message || lastError?.message || "Failed to create payout";
  return {
    ok: false,
    error: String(message).includes("CROSSSLOT")
      ? "Monime payout service is experiencing issues. Please try again in a moment."
      : message,
    status: lastStatus,
  };
}

/** Read one payout from Monime. */
export async function fetchPayout(
  payoutId: string
): Promise<{ ok: true; payout: any } | { ok: false; error: string; status: number }> {
  const creds = getMonimeCredentials({ preferPayoutKey: true });
  if (!creds) {
    return { ok: false, error: "Monime API credentials not configured", status: 500 };
  }
  const response = await fetch(
    `${MONIME_API}/payouts/${encodeURIComponent(payoutId)}`,
    {
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Monime-Space-Id": creds.spaceId,
        "Monime-Version": MONIME_VERSION,
      },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return {
      ok: false,
      error: err?.message || "Failed to get payout status",
      status: response.status,
    };
  }
  const payload = await response.json();
  return { ok: true, payout: payload.result };
}

/** Map a Monime payout to our ledger status, or null to leave it unchanged. */
export function ledgerStatusForPayout(payout: any): "completed" | "failed" | null {
  if (
    payout?.status === "completed" ||
    payout?.status === "paid" ||
    payout?.destination?.transactionReference
  ) {
    return "completed";
  }
  if (payout?.status === "failed" || payout?.status === "cancelled") {
    return "failed";
  }
  return null;
}

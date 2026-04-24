import { randomUUID } from "crypto";

export type MonimePayoutDestination = {
  providerCode: string;
  accountId: string;
};

export type MonimePayoutAmount = {
  currency: string;
  /** Major units (e.g. NLe / SLE dollars), same as existing `/api/monime/payout` API */
  value: number;
};

export type MonimePayoutInput = {
  amount: MonimePayoutAmount;
  destination: MonimePayoutDestination;
  source?: { financialAccountId?: string };
  metadata?: Record<string, unknown>;
  reference?: string;
};

function convertMetadataToStrings(
  metadata: Record<string, unknown>
): Record<string, string> {
  const stringMetadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") {
      stringMetadata[key] = JSON.stringify(value);
    } else {
      stringMetadata[key] = String(value);
    }
  }
  return stringMetadata;
}

/**
 * Normalize payout destination to E.164 for Sierra Leone or UK mobile; otherwise valid E.164.
 */
export function normalizePayoutPhone(raw: string):
  | { ok: true; e164: string }
  | { ok: false; error: string } {
  let s = raw.trim().replace(/[\s\-\(\)]/g, "");

  // UK: local 07xxxxxxxxx (11 digits) -> +447...
  if (/^07\d{9}$/.test(s)) {
    s = `+44${s.slice(1)}`;
  } else if (/^447\d{9}$/.test(s)) {
    s = `+${s}`;
  }

  if (s.startsWith("+44")) {
    const uk = s.replace(/\s/g, "");
    if (/^\+447\d{9}$/.test(uk)) {
      return { ok: true, e164: uk };
    }
    return {
      ok: false,
      error: `Invalid UK mobile format. Expected +447xxxxxxxxx. Got: ${raw}`,
    };
  }

  // Sierra Leone (existing behaviour)
  if (s.startsWith("+")) {
    if (s.startsWith("+2320") && s.length === 13) {
      s = s.replace("+2320", "+232");
    }
  } else if (s.startsWith("232")) {
    s = `+${s}`;
    if (s.startsWith("+2320") && s.length === 13) {
      s = s.replace("+2320", "+232");
    }
  } else {
    if (s.startsWith("0")) {
      s = s.substring(1);
    }
    s = `+232${s}`;
  }

  if (/^\+232\d{8}$/.test(s)) {
    return { ok: true, e164: s };
  }

  // Generic E.164 fallback (international Monime destinations)
  if (/^\+[1-9]\d{6,14}$/.test(s)) {
    return { ok: true, e164: s };
  }

  return {
    ok: false,
    error: `Could not normalize phone number for payout. Got: ${raw}`,
  };
}

export function toMonimeCurrency(currency: string): string {
  return currency === "NLe" ? "SLE" : currency;
}

export function buildMonimePayoutRequestBody(input: MonimePayoutInput) {
  const monimeCurrency = toMonimeCurrency(input.amount.currency);
  const phoneNorm = normalizePayoutPhone(input.destination.accountId);
  if (!phoneNorm.ok) {
    return { ok: false as const, error: phoneNorm.error };
  }

  const payoutRequest = {
    amount: {
      currency: monimeCurrency,
      value: Math.round(input.amount.value * 100),
    },
    destination: {
      type: "momo" as const,
      providerId: input.destination.providerCode,
      phoneNumber: phoneNorm.e164,
    },
    ...(input.source?.financialAccountId && {
      source: {
        financialAccountId: input.source.financialAccountId,
      },
    }),
    metadata: (() => {
      const stringMetadata: Record<string, string> = { source: "sos_seats" };
      if (input.metadata) {
        Object.assign(
          stringMetadata,
          convertMetadataToStrings(input.metadata as Record<string, unknown>)
        );
      }
      if (input.reference) {
        stringMetadata.reference = input.reference;
      }
      return stringMetadata;
    })(),
  };

  return { ok: true as const, payoutRequest, formattedPhone: phoneNorm.e164 };
}

export type MonimePayoutSuccess = { success: true; data: unknown };
export type MonimePayoutFailure = {
  success: false;
  error: string;
  status: number;
  isInfrastructureError?: boolean;
  raw?: unknown;
};

/**
 * POST https://api.monime.io/v1/payouts with retries (same semantics as `/api/monime/payout`).
 */
export async function postMonimePayout(
  input: MonimePayoutInput,
  apiKey: string,
  spaceId: string
): Promise<MonimePayoutSuccess | MonimePayoutFailure> {
  const built = buildMonimePayoutRequestBody(input);
  if (!built.ok) {
    return { success: false, error: built.error, status: 400 };
  }

  const idempotencyKey = randomUUID();
  const maxRetries = 3;
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const retryIdempotencyKey = attempt === 0 ? idempotencyKey : randomUUID();
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }

    const response = await fetch("https://api.monime.io/v1/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Monime-Space-Id": spaceId,
        "Monime-Version": "caph.2025-08-23",
        "Idempotency-Key": retryIdempotencyKey,
      },
      body: JSON.stringify(built.payoutRequest),
    });

    lastResponse = response;

    if (response.ok) {
      const payout = await response.json();
      return { success: true, data: payout.result ?? payout };
    }

    const errorData: unknown = await response.json().catch(() => ({}));
    lastError = errorData;

    const errMsg =
      errorData &&
      typeof errorData === "object" &&
      "error" in errorData &&
      (errorData as { error?: { message?: string } }).error?.message
        ? String((errorData as { error: { message?: string } }).error.message)
        : "";

    const isTransientError =
      response.status === 500 && errMsg.includes("CROSSSLOT");

    if (!isTransientError || attempt === maxRetries - 1) {
      break;
    }
  }

  const lastErrObj = lastError as Record<string, unknown> | null;
  const nested =
    lastErrObj &&
    typeof lastErrObj.error === "object" &&
    lastErrObj.error !== null
      ? (lastErrObj.error as { message?: string }).message
      : undefined;
  const errorMessage =
    (typeof nested === "string" ? nested : null) ||
    (typeof lastErrObj?.message === "string" ? lastErrObj.message : null) ||
    "Failed to create payout. This may be a temporary Monime infrastructure issue.";

  const userMessage = String(errorMessage).includes("CROSSSLOT")
    ? "Monime payout service is experiencing issues. Please try again in a moment or contact support if the problem persists."
    : errorMessage;

  return {
    success: false,
    error: userMessage,
    status: lastResponse?.status || 500,
    isInfrastructureError: String(errorMessage).includes("CROSSSLOT"),
    raw: lastError,
  };
}

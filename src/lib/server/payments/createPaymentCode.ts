/**
 * Kit Monime payment-code create (roadmap 5.2 / FR-14 / FR-15).
 * Do not import from client components.
 */
import { randomUUID } from "crypto";
import { getMonimeCredentials } from "./monimeEnv";

export type CreatePaymentCodeInput = {
  name: string;
  amount: { currency: string; value: number };
  mode?: "one_time" | "recurrent";
  duration?: string;
  authorizedProviders?: string[];
  metadata?: Record<string, unknown>;
  reference?: string;
};

export type CreatePaymentCodeResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      error: string;
      status: number;
      details?: unknown;
      isInfrastructureError?: boolean;
    };

export async function createPaymentCode(
  input: CreatePaymentCodeInput
): Promise<CreatePaymentCodeResult> {
  const creds = getMonimeCredentials();
  if (!creds) {
    return {
      ok: false,
      error: "Monime API credentials not configured",
      status: 500,
    };
  }

  const paymentCodeRequest = {
    name: input.name,
    mode: input.mode || "one_time",
    amount: input.amount,
    duration: input.duration || "30m",
    enable: true,
    authorizedProviders: input.authorizedProviders || [],
    reference: input.reference,
    metadata: {
      source: "sos_seats",
      ...input.metadata,
    },
  };

  const maxRetries = 3;
  let lastError: unknown = null;
  let lastStatus = 500;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const idempotencyKey = randomUUID();

    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }

    const response = await fetch("https://api.monime.io/v1/payment-codes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "Content-Type": "application/json",
        "Monime-Space-Id": creds.spaceId,
        "Monime-Version": "caph.2025-08-23",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentCodeRequest),
    });

    lastStatus = response.status;

    if (response.ok) {
      const paymentCode = await response.json();
      return { ok: true, data: paymentCode.result };
    }

    const errorData = await response.json().catch(() => ({}));
    lastError = errorData;

    const msg =
      typeof errorData === "object" &&
      errorData &&
      "error" in errorData &&
      typeof (errorData as { error?: { message?: string } }).error?.message ===
        "string"
        ? (errorData as { error: { message: string } }).error.message
        : "";

    const isTransientError =
      response.status === 500 && msg.includes("CROSSSLOT");

    if (!isTransientError || attempt === maxRetries - 1) {
      break;
    }
  }

  const errObj =
    lastError && typeof lastError === "object"
      ? (lastError as {
          error?: { message?: string };
          message?: string;
        })
      : null;

  const errorMessage =
    errObj?.error?.message ||
    errObj?.message ||
    "Failed to create payment code. This may be a temporary Monime infrastructure issue.";

  const isInfrastructureError = Boolean(
    errObj?.error?.message?.includes("CROSSSLOT")
  );

  const userMessage = isInfrastructureError
    ? "Monime payment service is experiencing issues. Please try again in a moment or contact support if the problem persists."
    : errorMessage;

  return {
    ok: false,
    error: userMessage,
    status: lastStatus || 500,
    details: lastError,
    isInfrastructureError,
  };
}

import type { RequestHandler } from "./$types";
import { randomUUID } from "crypto";
import { getMonimePaymentApiKeys } from "$lib/server/monimeEnv";
import { jsonError, jsonSuccess } from "$lib/server/apiResponse";

/**
 * POST /api/monime/payment-code
 * Contract: see docs/API_CONTRACT.md (reference Monime route for envelope + codes).
 */

interface PaymentCodeRequest {
  name: string;
  amount: { currency: string; value: number };
  mode?: "one_time" | "recurrent";
  duration?: string;
  authorizedProviders?: string[];
  metadata?: Record<string, unknown>;
  reference?: string;
}

function monimeErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const o = payload as Record<string, unknown>;
  const err = o.error;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  if (typeof o.message === "string") return o.message;
  return undefined;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: PaymentCodeRequest = await request.json();

    const { apiKey, spaceId } = getMonimePaymentApiKeys();

    if (!apiKey || !spaceId) {
      return jsonError("Monime API credentials not configured", 500, {
        code: "MONIME_NOT_CONFIGURED",
      });
    }

    // Prepare payment code request
    const paymentCodeRequest = {
      name: body.name,
      mode: body.mode || "one_time",
      amount: body.amount,
      duration: body.duration || "30m", // Default 30 minutes
      enable: true,
      authorizedProviders: body.authorizedProviders || [], // m17 = Orange Money, m18 = Afrimoney
      reference: body.reference,
      metadata: {
        source: "sos_seats",
        ...body.metadata,
      },
    };

    // Make request to Monime API with retry logic for transient errors
    // Idempotency-Key is required by Monime API (see docs: https://docs.monime.io/apis/versions/caph-2025-08-23/payment-code/create-payment-code)
    const maxRetries = 3;
    let lastError: unknown = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Generate a unique UUID for idempotency on each retry
      const idempotencyKey = randomUUID();

      if (attempt > 0) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }

      const response = await fetch("https://api.monime.io/v1/payment-codes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Monime-Space-Id": spaceId,
          "Monime-Version": "caph.2025-08-23",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(paymentCodeRequest),
      });

      lastResponse = response;

      if (response.ok) {
        const paymentCode: unknown = await response.json();
        const result =
          paymentCode &&
          typeof paymentCode === "object" &&
          "result" in paymentCode
            ? (paymentCode as { result: unknown }).result
            : paymentCode;
        return jsonSuccess(result);
      }

      // Check if it's a CROSSSLOT error (500) - might be transient
      const errorData: unknown = await response.json().catch(() => ({}));
      lastError = errorData;

      const errMsg = monimeErrorMessage(errorData) ?? "";
      const isTransientError =
        response.status === 500 && errMsg.includes("CROSSSLOT");

      // If it's not a transient error, break and return the error
      if (!isTransientError || attempt === maxRetries - 1) {
        break;
      }
    }

    // All retries failed or non-retryable error
    const errorMessage =
      monimeErrorMessage(lastError) ||
      "Failed to create payment code. This may be a temporary Monime infrastructure issue.";

    const lastErrStr = monimeErrorMessage(lastError) ?? "";
    const userMessage = lastErrStr.includes("CROSSSLOT")
      ? "Monime payment service is experiencing issues. Please try again in a moment or contact support if the problem persists."
      : errorMessage;

    const isInfrastructureError = lastErrStr.includes("CROSSSLOT");

    return jsonError(userMessage, lastResponse?.status || 500, {
      code: "MONIME_PAYMENT_CODE_FAILED",
      details: lastError,
      isInfrastructureError,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to create payment code",
      500,
      { code: "MONIME_PAYMENT_CODE_FAILED" }
    );
  }
};

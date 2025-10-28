import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { randomUUID } from "crypto";
import { env } from "$env/dynamic/public";

interface PaymentCodeRequest {
  name: string;
  amount: { currency: string; value: number };
  mode?: "one_time" | "recurrent";
  duration?: string;
  authorizedProviders?: string[];
  metadata?: Record<string, any>;
  reference?: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: PaymentCodeRequest = await request.json();

    // Get Monime credentials from environment (using same pattern as checkout-session)
    const apiKey = env.PUBLIC_MONIME_API_KEY;
    const spaceId = env.PUBLIC_MONIME_SPACE_ID;
    const environment = env.PUBLIC_MONIME_ENVIRONMENT || "live";

    if (!apiKey || !spaceId) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
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
    let lastError: any = null;
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
        const paymentCode = await response.json();
        return json({
          success: true,
          data: paymentCode.result,
        });
      }

      // Check if it's a CROSSSLOT error (500) - might be transient
      const errorData = await response.json().catch(() => ({}));
      lastError = errorData;

      const isTransientError =
        response.status === 500 &&
        errorData?.error?.message?.includes("CROSSSLOT");

      // If it's not a transient error, break and return the error
      if (!isTransientError || attempt === maxRetries - 1) {
        break;
      }
    }

    // All retries failed or non-retryable error
    // Extract error message from Monime's error structure
    const errorMessage =
      lastError?.error?.message ||
      lastError?.message ||
      "Failed to create payment code. This may be a temporary Monime infrastructure issue.";

    // Provide user-friendly message for CROSSSLOT errors
    const userMessage = lastError?.error?.message?.includes("CROSSSLOT")
      ? "Monime payment service is experiencing issues. Please try again in a moment or contact support if the problem persists."
      : errorMessage;

    return json(
      {
        success: false,
        error: userMessage,
        details: lastError,
        isInfrastructureError: lastError?.error?.message?.includes("CROSSSLOT"),
      },
      { status: lastResponse?.status || 500 }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment code",
      },
      { status: 500 }
    );
  }
};

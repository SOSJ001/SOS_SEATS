import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/public";
import { randomUUID } from "crypto";

interface PayoutRequest {
  amount: {
    currency: string;
    value: number;
  };
  destination: {
    providerCode: string; // "m17" for Orange Money, "m18" for Afrimoney
    accountId: string; // Phone number with country code (e.g., "+23278000000")
  };
  source?: {
    financialAccountId?: string;
  };
  metadata?: Record<string, any>;
  reference?: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: PayoutRequest = await request.json();

    // Validate request body
    if (!body.amount || !body.amount.currency || !body.amount.value) {
      return json(
        { success: false, error: "Amount with currency and value is required" },
        { status: 400 }
      );
    }

    if (
      !body.destination ||
      !body.destination.providerCode ||
      !body.destination.accountId
    ) {
      return json(
        {
          success: false,
          error: "Destination with providerCode and accountId is required",
        },
        { status: 400 }
      );
    }

    // Get Monime credentials from environment
    const apiKey = env.PUBLIC_MONIME_API_KEY;
    const spaceId = env.PUBLIC_MONIME_SPACE_ID;
    const environment = env.PUBLIC_MONIME_ENVIRONMENT || "live";

    if (!apiKey || !spaceId) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
    }

    // Prepare payout request
    const payoutRequest = {
      amount: {
        currency: body.amount.currency,
        value: Math.round(body.amount.value * 100), // Convert to smallest currency unit (cents)
      },
      destination: {
        providerCode: body.destination.providerCode,
        accountId: body.destination.accountId,
      },
      ...(body.source?.financialAccountId && {
        source: {
          financialAccountId: body.source.financialAccountId,
        },
      }),
      metadata: {
        source: "sos_seats",
        ...body.metadata,
      },
      ...(body.reference && { reference: body.reference }),
    };

    // Generate idempotency key
    const idempotencyKey = randomUUID();

    // Make request to Monime API with retry logic for transient errors
    const maxRetries = 3;
    let lastError: any = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Generate a unique UUID for idempotency on each retry
      const retryIdempotencyKey = attempt === 0 ? idempotencyKey : randomUUID();

      if (attempt > 0) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
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
        body: JSON.stringify(payoutRequest),
      });

      lastResponse = response;

      if (response.ok) {
        const payout = await response.json();
        return json({
          success: true,
          data: payout.result,
        });
      }

      // Check if it's a CROSSSLOT error (500) - might be transient
      const errorData = await response.json().catch(() => ({}));
      lastError = errorData;

      const isTransientError =
        response.status === 500 &&
        (errorData?.error?.message?.includes("CROSSSLOT") ||
          errorData?.message?.includes("CROSSSLOT"));

      // If it's not a transient error, break and return the error
      if (!isTransientError || attempt === maxRetries - 1) {
        break;
      }
    }

    // All retries failed or non-retryable error
    const errorMessage =
      lastError?.error?.message ||
      lastError?.message ||
      "Failed to create payout. This may be a temporary Monime infrastructure issue.";

    // Provide user-friendly message for CROSSSLOT errors
    const userMessage = lastError?.error?.message?.includes("CROSSSLOT")
      ? "Monime payout service is experiencing issues. Please try again in a moment or contact support if the problem persists."
      : errorMessage;

    return json(
      {
        success: false,
        error: userMessage,
        isInfrastructureError:
          lastError?.error?.message?.includes("CROSSSLOT") || false,
      },
      { status: lastResponse?.status || 500 }
    );
  } catch (error) {
    console.error("Payout creation error:", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create payout",
      },
      { status: 500 }
    );
  }
};

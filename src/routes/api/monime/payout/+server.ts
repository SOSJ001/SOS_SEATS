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
    // Prioritize payout API key if available (may have different permissions)
    const apiKey =
      env.PUBLIC_MONIME_PAYOUT_API_KEY || env.PUBLIC_MONIME_API_KEY;
    const spaceId = env.PUBLIC_MONIME_SPACE_ID;
    const environment = env.PUBLIC_MONIME_ENVIRONMENT || "live";

    if (!apiKey || !spaceId) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
    }

    // Validate and format phone number
    let formattedPhone = body.destination.accountId.trim();
    // Remove any spaces, dashes, or other characters
    formattedPhone = formattedPhone.replace(/[\s\-\(\)]/g, "");

    // Handle different phone number formats
    if (formattedPhone.startsWith("+")) {
      // Already has country code, use as is
      // Remove leading 0 if present after +232 (e.g., +232078002221 -> +23278002221)
      if (formattedPhone.startsWith("+2320") && formattedPhone.length === 13) {
        formattedPhone = formattedPhone.replace("+2320", "+232");
      }
    } else if (formattedPhone.startsWith("232")) {
      // Has country code without +
      formattedPhone = `+${formattedPhone}`;
      // Remove leading 0 if present (e.g., +232078002221 -> +23278002221)
      if (formattedPhone.startsWith("+2320") && formattedPhone.length === 13) {
        formattedPhone = formattedPhone.replace("+2320", "+232");
      }
    } else {
      // Local number - remove leading 0 if present, then add +232
      // Sierra Leone numbers often start with 0 (e.g., 078002221 -> 78002221 -> +23278002221)
      if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.substring(1); // Remove leading 0
      }
      formattedPhone = `+232${formattedPhone}`;
    }

    // Validate format: +232 followed by exactly 8 digits
    const phoneRegex = /^\+232\d{8}$/;
    if (!phoneRegex.test(formattedPhone)) {
      return json(
        {
          success: false,
          error: `Invalid phone number format. Expected +232XXXXXXXX (exactly 8 digits after +232). Got: ${body.destination.accountId}`,
        },
        { status: 400 }
      );
    }

    // Convert currency from "NLe" to "SLE" for Monime API (Monime uses ISO currency codes)
    const monimeCurrency =
      body.amount.currency === "NLe" ? "SLE" : body.amount.currency;

    // Helper function to convert all metadata values to strings (Monime requires StringMap)
    function convertMetadataToStrings(
      metadata: Record<string, any>
    ): Record<string, string> {
      const stringMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(metadata)) {
        if (value === null || value === undefined) {
          continue;
        } else if (typeof value === "object") {
          stringMetadata[key] = JSON.stringify(value);
        } else {
          stringMetadata[key] = String(value);
        }
      }
      return stringMetadata;
    }

    // Prepare payout request
    const payoutRequest = {
      amount: {
        currency: monimeCurrency, // Use ISO currency code (SLE) for Monime API
        value: Math.round(body.amount.value * 100), // Convert to smallest currency unit (cents)
      },
      destination: {
        type: "momo", // Required: specifies destination type (bank, momo, or wallet)
        providerId: body.destination.providerCode, // Use providerId (Monime expects this, not providerCode)
        phoneNumber: formattedPhone, // Use phoneNumber for momo destination
      },
      ...(body.source?.financialAccountId && {
        source: {
          financialAccountId: body.source.financialAccountId,
        },
      }),
      metadata: (() => {
        const stringMetadata: Record<string, string> = {
          source: "sos_seats",
        };
        if (body.metadata) {
          for (const [key, value] of Object.entries(body.metadata)) {
            if (value === null || value === undefined) {
              continue;
            } else if (typeof value === "object") {
              stringMetadata[key] = JSON.stringify(value);
            } else {
              stringMetadata[key] = String(value);
            }
          }
        }
        // Add reference to metadata if provided (Monime doesn't allow reference as top-level field)
        if (body.reference) {
          stringMetadata.reference = body.reference;
        }
        return stringMetadata;
      })(),
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

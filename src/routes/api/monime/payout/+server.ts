import type { RequestHandler } from "./$types";
import { getMonimePayoutApiKeys } from "$lib/server/monimeEnv";
import { postMonimePayout, type MonimePayoutInput } from "$lib/server/monimePayout";
import { json } from "@sveltejs/kit";

interface PayoutRequest extends MonimePayoutInput {
  metadata?: Record<string, unknown>;
}

/**
 * Low-level Monime payout proxy. Prefer `POST /api/payouts` from product code
 * (session + balance check). This route remains for internal `monimeService` calls.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as PayoutRequest;

    if (!body.amount || !body.amount.currency || body.amount.value === undefined) {
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

    const { apiKey, spaceId } = getMonimePayoutApiKeys();

    if (!apiKey || !spaceId) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
    }

    const result = await postMonimePayout(body, apiKey, spaceId);

    if (!result.success) {
      return json(
        {
          success: false,
          error: result.error,
          isInfrastructureError: result.isInfrastructureError ?? false,
        },
        { status: result.status }
      );
    }

    return json({
      success: true,
      data: result.data,
    });
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

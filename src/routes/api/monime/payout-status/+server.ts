import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getMonimeCredentials } from "$lib/server/payments";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const payoutId = url.searchParams.get("payoutId");

    if (!payoutId) {
      return json(
        { success: false, error: "Payout ID required" },
        { status: 400 }
      );
    }

    const creds = getMonimeCredentials({ preferPayoutKey: true });
    if (!creds) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
    }
    const { apiKey, spaceId } = creds;

    // Get payout status from Monime API
    const response = await fetch(
      `https://api.monime.io/v1/payouts/${payoutId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Monime-Space-Id": spaceId,
          "Monime-Version": "caph.2025-08-23",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return json(
        {
          success: false,
          error: errorData.message || "Failed to get payout status",
        },
        { status: response.status }
      );
    }

    const payout = await response.json();

    return json({
      success: true,
      data: payout.result,
    });
  } catch (error) {
    console.error("Payout status check error:", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get payout status",
      },
      { status: 500 }
    );
  }
};


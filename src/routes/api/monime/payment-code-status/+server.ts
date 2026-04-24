import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getMonimePaymentApiKeys } from "$lib/server/monimeEnv";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const codeId = url.searchParams.get("codeId");

    if (!codeId) {
      return json(
        { success: false, error: "Payment code ID required" },
        { status: 400 }
      );
    }

    const { apiKey, spaceId } = getMonimePaymentApiKeys();

    if (!apiKey || !spaceId) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
    }

    // Get payment code status from Monime API
    const response = await fetch(
      `https://api.monime.io/v1/payment-codes/${codeId}`,
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
          error: errorData.message || "Failed to get payment code status",
        },
        { status: response.status }
      );
    }

    const paymentCode = await response.json();

    return json({
      success: true,
      data: paymentCode.result,
    });
  } catch (error) {
    console.error("Payment code status error:", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get payment code status",
      },
      { status: 500 }
    );
  }
};

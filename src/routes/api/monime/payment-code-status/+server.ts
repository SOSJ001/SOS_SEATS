import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getMonimeCredentials } from "$lib/server/payments";

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const codeId = url.searchParams.get("codeId");

    if (!codeId) {
      return json(
        { success: false, error: "Payment code ID required" },
        { status: 400 }
      );
    }

    const creds = getMonimeCredentials();
    if (!creds) {
      return json(
        { success: false, error: "Monime API credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.monime.io/v1/payment-codes/${codeId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          "Monime-Space-Id": creds.spaceId,
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

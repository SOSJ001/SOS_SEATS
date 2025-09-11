import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      console.error("Payment status API: Missing sessionId parameter");
      return json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    // Get environment variables
    const apiKey = env.PUBLIC_MONIME_API_KEY;
    const spaceId = env.PUBLIC_MONIME_SPACE_ID;
    const environment = env.PUBLIC_MONIME_ENVIRONMENT || "test";

    if (!apiKey || !spaceId) {
      return json(
        {
          error:
            "Monime API configuration missing. Please check environment variables.",
        },
        { status: 500 }
      );
    }

    // Check if this is a mock session (test mode)
    if (sessionId.startsWith("mock_") || environment === "test") {
      // Return a mock completed payment status for testing
      return json({
        success: true,
        data: {
          id: sessionId,
          status: "completed",
          amount: 50000, // Mock amount
          currency: "SLE",
          payment_method: "orange_money",
          transaction_id: `mock_txn_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            event_id: "53b886fe-6821-45c1-b529-87358b17aaf5", // Mock event ID
            ticket_details: [
              {
                id: "f4dcc5b8-f733-469b-b376-e4db12d41ce3",
                name: "General A",
                price: 0.01,
                quantity: 1,
              },
            ],
            selected_tickets: {
              "f4dcc5b8-f733-469b-b376-e4db12d41ce3": 1,
            },
            buyer_name: "Orange Money User",
            buyer_wallet: undefined,
          },
        },
      });
    }

    // Make request to Monime API
    const response = await fetch(
      `https://api.monime.io/v1/checkout-sessions/${sessionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Monime-Space-Id": spaceId,
          "Monime-Version": "caph.2025-08-23",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Monime API Error:", response.status, errorData);

      return json(
        {
          error: `Monime API Error: ${response.status} - ${
            errorData.message || response.statusText
          }`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const paymentStatus = await response.json();

    return json({
      success: true,
      data: paymentStatus,
    });
  } catch (error) {
    console.error("Payment status check error:", error);

    return json(
      {
        error: "Failed to get payment status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

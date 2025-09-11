import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";
import { randomUUID } from "crypto";
import type { RequestHandler } from "./$types";

interface LineItem {
  type: "custom";
  name: string;
  price: { currency: string; value: number };
  quantity: number;
  description?: string;
  reference?: string;
}

interface CheckoutSessionRequest {
  name: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: LineItem[];
  metadata?: Record<string, any>;
  reference?: string;
}

interface CheckoutSessionResponse {
  success: boolean;
  messages: string[];
  result: {
    id: string;
    status: string;
    name: string;
    orderNumber: string;
    reference?: string;
    description: string;
    redirectUrl: string;
    cancelUrl: string;
    successUrl: string;
    lineItems: {
      data: LineItem[];
    };
    expireTime: string;
    createTime: string;
    metadata: Record<string, any>;
  };
}

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const body: CheckoutSessionRequest = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.description ||
      !body.successUrl ||
      !body.cancelUrl ||
      !body.lineItems ||
      !Array.isArray(body.lineItems) ||
      body.lineItems.length === 0
    ) {
      return json(
        {
          error:
            "Missing required fields: name, description, successUrl, cancelUrl, lineItems",
        },
        { status: 400 }
      );
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
          debug: {
            hasApiKey: !!apiKey,
            hasSpaceId: !!spaceId,
            environment: environment,
          },
        },
        { status: 500 }
      );
    }

    // For test/mock environment, use simple mock checkout
    if (environment === "test" || environment === "mock") {
      // Return a mock checkout session for testing
      const mockSessionId = `mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const totalAmount = body.lineItems.reduce(
        (total, item) => total + item.price.value * item.quantity,
        0
      );
      const currency = body.lineItems[0]?.price.currency || "SLE";
      const eventId = body.metadata?.event_id || "unknown";
      const paymentMethod = body.metadata?.payment_method || "orange_money";

      // Redirect to our mock checkout page
      const mockRedirectUrl = `/payment/mock-checkout?mock_session_id=${mockSessionId}&amount=${totalAmount}&currency=${currency}&event_id=${eventId}&payment_method=${paymentMethod}`;

      return json({
        success: true,
        data: {
          id: mockSessionId,
          checkout_url: mockRedirectUrl,
          status: "pending",
          amount: body.lineItems.reduce(
            (total, item) => total + item.price.value * item.quantity,
            0
          ),
          currency: body.lineItems[0]?.price.currency || "SLE",
          created_at: new Date().toISOString(),
        },
      });
    }

    // Prepare the request to Monime API
    const monimeRequest = {
      name: body.name,
      description: body.description,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      lineItems: body.lineItems,
      reference: body.reference,
      metadata: {
        source: "sos_seats",
        ...body.metadata,
      },
    };

    // Make request to Monime API
    const response = await fetch("https://api.monime.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Monime-Space-Id": spaceId,
        "Monime-Version": "caph.2025-08-23",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify(monimeRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Monime API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorData: errorData,
        requestHeaders: {
          Authorization: `Bearer ${
            apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING"
          }`,
          "Monime-Space-Id": spaceId
            ? `${spaceId.substring(0, 10)}...`
            : "MISSING",
          "Monime-Version": "caph.2025-08-23",
        },
      });

      return json(
        {
          error: `Monime API Error: ${response.status} - ${
            errorData.message || response.statusText
          }`,
          details: errorData,
          debug: {
            status: response.status,
            statusText: response.statusText,
            hasApiKey: !!apiKey,
            hasSpaceId: !!spaceId,
            environment: environment,
          },
        },
        { status: response.status }
      );
    }

    const checkoutSession: CheckoutSessionResponse = await response.json();

    return json({
      success: true,
      data: {
        id: checkoutSession.result.id,
        checkout_url: checkoutSession.result.redirectUrl,
        status: checkoutSession.result.status,
        amount: checkoutSession.result.lineItems.data.reduce(
          (total, item) => total + item.price.value * item.quantity,
          0
        ),
        currency:
          checkoutSession.result.lineItems.data[0]?.price.currency || "SLE",
        created_at: checkoutSession.result.createTime,
      },
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);

    return json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

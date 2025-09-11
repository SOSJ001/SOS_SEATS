// Monime API service for Orange Money integration

interface MonimeConfig {
  apiKey: string;
  baseUrl: string;
  environment: "test" | "live";
  spaceId: string;
}

interface CheckoutSessionResponse {
  id: string;
  checkout_url: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
}

interface PaymentStatus {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

class MonimeService {
  private config: MonimeConfig;

  constructor(
    apiKey: string,
    spaceId: string,
    environment: "test" | "live" = "test"
  ) {
    this.config = {
      apiKey,
      baseUrl: "https://api.monime.io",
      environment,
      spaceId,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Use our server-side API routes instead of direct Monime API calls
    let url: string;

    if (endpoint === "/v1/checkout-sessions" && options.method === "POST") {
      url = "/api/monime/checkout-session";
    } else if (
      endpoint.startsWith("/v1/checkout-sessions/") &&
      options.method === "GET"
    ) {
      const sessionId = endpoint.split("/").pop();
      url = `/api/monime/payment-status?sessionId=${sessionId}`;
    } else {
      console.error(
        "Unsupported endpoint pattern:",
        endpoint,
        "Method:",
        options.method
      );
      throw new Error(`Unsupported endpoint: ${endpoint}`);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Monime API Error: ${response.status} - ${
          error.error || error.message || response.statusText
        }`
      );
    }

    const result = await response.json();

    // Handle our API response format
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error || "Unknown API error");
    }
  }

  /**
   * Create a checkout session for Orange Money payment
   */
  async createCheckoutSession(
    name: string,
    description: string,
    successUrl: string,
    cancelUrl: string,
    lineItems: Array<{
      type: "custom";
      name: string;
      price: { currency: string; value: number };
      quantity: number;
      description?: string;
      reference?: string;
    }>,
    metadata?: Record<string, any>,
    reference?: string
  ): Promise<CheckoutSessionResponse> {
    const requestBody = {
      name,
      description,
      successUrl,
      cancelUrl,
      lineItems,
      reference,
      metadata: {
        source: "sos_seats",
        ...metadata,
      },
    };

    return this.makeRequest<CheckoutSessionResponse>("/v1/checkout-sessions", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Get payment status by session ID
   */
  async getPaymentStatus(
    sessionId: string,
    paymentMethod?: string
  ): Promise<PaymentStatus> {
    const endpoint = `/v1/checkout-sessions/${sessionId}`;
    const url = paymentMethod
      ? `/api/monime/payment-status?sessionId=${sessionId}&payment_method=${paymentMethod}`
      : `/api/monime/payment-status?sessionId=${sessionId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Monime API Error: ${response.status} - ${
          error.error || error.message || response.statusText
        }`
      );
    }

    const result = await response.json();

    // Handle our API response format
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error || "Unknown API error");
    }
  }

  /**
   * List payments with optional filters
   */
  async listPayments(filters?: {
    orderNumber?: string;
    financialAccountId?: string;
    limit?: number;
    after?: string;
  }): Promise<{ result: PaymentStatus[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters?.orderNumber) params.append("orderNumber", filters.orderNumber);
    if (filters?.financialAccountId)
      params.append("financialAccountId", filters.financialAccountId);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.after) params.append("after", filters.after);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/v1/payments?${queryString}`
      : "/v1/payments";

    return this.makeRequest<{ result: PaymentStatus[]; pagination: any }>(
      endpoint
    );
  }
}

// Export singleton instance
// Note: API key and space ID are now handled server-side
export const monimeService = new MonimeService(
  "", // API key handled server-side
  "", // Space ID handled server-side
  "test" // Environment handled server-side
);

export { MonimeService, type CheckoutSessionResponse, type PaymentStatus };

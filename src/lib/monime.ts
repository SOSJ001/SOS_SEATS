// Monime API service for Orange Money integration

interface MonimeConfig {
  apiKey: string;
  baseUrl: string;
  environment: "test" | "live";
  spaceId: string;
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

  /**
   * Create a Payment Code for in-app mobile money payment
   */
  async createPaymentCode(
    name: string,
    amount: { currency: string; value: number },
    authorizedProviders?: string[],
    metadata?: Record<string, any>,
    reference?: string
  ): Promise<{
    id: string;
    ussdCode: string;
    status: string;
    expireTime: string;
    amount: { currency: string; value: number };
  }> {
    const response = await fetch("/api/monime/payment-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        amount,
        mode: "one_time",
        duration: "30m",
        authorizedProviders,
        metadata,
        reference,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.error || error.message || response.statusText;
      const fullError = new Error(
        `Monime API Error: ${response.status} - ${errorMessage}`
      ) as any;

      // Pass through infrastructure error flag from API
      if (error.isInfrastructureError) {
        fullError.isInfrastructureError = true;
      }

      throw fullError;
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      const errorMessage = result.error || "Unknown API error";
      const error = new Error(errorMessage) as any;

      // Pass through infrastructure error flag from API
      if (result.isInfrastructureError) {
        error.isInfrastructureError = true;
      }

      throw error;
    }
  }

  /**
   * Cancel/Delete a Payment Code
   * Only works if the code hasn't been used yet
   */
  async cancelPaymentCode(paymentCodeId: string): Promise<boolean> {
    const response = await fetch(
      `/api/monime/payment-code-cancel?codeId=${paymentCodeId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Monime API Error: ${response.status} - ${
          error.error || error.message || response.statusText
        }`
      );
    }

    const result = await response.json();
    return result.success === true;
  }

  /**
   * Get Payment Code status
   */
  async getPaymentCodeStatus(paymentCodeId: string): Promise<{
    id: string;
    status: string;
    ussdCode: string;
    processedPaymentData?: any;
    metadata?: Record<string, any>;
  }> {
    const response = await fetch(
      `/api/monime/payment-code-status?codeId=${paymentCodeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Monime API Error: ${response.status} - ${
          error.error || error.message || response.statusText
        }`
      );
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.error || "Unknown API error");
    }
  }
}

// Export singleton instance
// Note: API key and space ID are now handled server-side
export const monimeService = new MonimeService(
  "", // API key handled server-side
  "", // Space ID handled server-side
  "test" // Environment handled server-side
);

export { MonimeService, type PaymentStatus };

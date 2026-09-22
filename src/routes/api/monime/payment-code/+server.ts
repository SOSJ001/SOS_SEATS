import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createPaymentCode } from "$lib/server/payments";

interface PaymentCodeRequest {
  name: string;
  amount: { currency: string; value: number };
  mode?: "one_time" | "recurrent";
  duration?: string;
  authorizedProviders?: string[];
  metadata?: Record<string, unknown>;
  reference?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: PaymentCodeRequest = await request.json();
    const result = await createPaymentCode(body);

    if (result.ok) {
      return json({ success: true, data: result.data });
    }

    return json(
      {
        success: false,
        error: result.error,
        details: result.details,
        isInfrastructureError: result.isInfrastructureError,
      },
      { status: result.status }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment code",
      },
      { status: 500 }
    );
  }
};

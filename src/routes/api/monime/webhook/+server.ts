import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  fulfillPaymentCode,
  getMonimeWebhookSecret,
  verifyMonimeWebhookSignature,
} from "$lib/server/payments";

/**
 * Monime payment-code webhook (roadmap 5.4 / FR-34 / FR-35).
 * Auth: Monime-Signature + MONIME_WEBHOOK_SECRET (no session).
 */
export const POST: RequestHandler = async ({ request }) => {
  const secret = getMonimeWebhookSecret();
  if (!secret) {
    return json(
      { success: false, error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get("monime-signature") ||
    request.headers.get("Monime-Signature") ||
    "";

  let payload: Record<string, unknown>;
  try {
    payload = verifyMonimeWebhookSignature(rawBody, signature, secret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid webhook signature";
    return json({ success: false, error: message }, { status: 401 });
  }

  const event = payload.event as { name?: string; id?: string } | undefined;
  const eventName = event?.name || "";
  if (
    eventName !== "payment_code.processed" &&
    eventName !== "payment_code.completed"
  ) {
    return json({ success: true, ignored: true, event: eventName });
  }

  const object = payload.object as { id?: string } | undefined;
  const data = (payload.data as Record<string, unknown> | undefined) || null;
  const paymentCodeId =
    (typeof object?.id === "string" && object.id) ||
    (typeof data?.id === "string" && data.id) ||
    "";

  if (!paymentCodeId) {
    return json(
      { success: false, error: "Missing payment code id" },
      { status: 400 }
    );
  }

  const metadata =
    (data?.metadata as Record<string, unknown> | null | undefined) ?? null;

  try {
    const result = await fulfillPaymentCode({
      paymentCodeId,
      metadata,
      data,
    });

    if (!result.ok) {
      return json(
        { success: false, error: result.error },
        { status: result.status || 500 }
      );
    }

    if (result.skipped) {
      return json({
        success: true,
        skipped: true,
        reason: result.reason,
      });
    }

    return json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (error) {
    console.error("Monime webhook fulfill error:", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook fulfill failed",
      },
      { status: 500 }
    );
  }
};

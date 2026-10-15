import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  cancelMonimePaymentCode,
  fetchPaymentCodeFromMonime,
  markPaymentCodeEnded,
} from "$lib/server/payments";

/** Cancel an unused payment code the signed-in user created. */
export const DELETE: RequestHandler = async ({ url, locals }) => {
  if (!locals.userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const codeId = url.searchParams.get("codeId");
  if (!codeId) {
    return json(
      { success: false, error: "Payment code ID required" },
      { status: 400 }
    );
  }

  try {
    const code = await fetchPaymentCodeFromMonime(codeId);
    const meta = (code?.metadata || {}) as Record<string, unknown>;
    if (!code || String(meta.buyer_id || "") !== locals.userId) {
      return json({ success: false, error: "Not found" }, { status: 404 });
    }

    const cancelled = await cancelMonimePaymentCode(codeId);
    if (!cancelled.ok) {
      return json(
        { success: false, error: cancelled.error },
        { status: cancelled.status }
      );
    }

    // Only after Monime confirms, so a paid attempt is never shown as cancelled.
    await markPaymentCodeEnded(codeId, "cancelled");
    return json({ success: true, data: cancelled.data });
  } catch (error) {
    return json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to cancel payment code",
      },
      { status: 500 }
    );
  }
};

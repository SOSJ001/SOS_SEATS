import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fetchPaymentCodeFromMonime } from "$lib/server/payments";

/** Status of a payment code the signed-in user created. */
export const GET: RequestHandler = async ({ url, locals }) => {
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
    return json({ success: true, data: code });
  } catch (error) {
    console.error("Payment code status error:", error);
    return json(
      { success: false, error: "Failed to get payment code status" },
      { status: 500 }
    );
  }
};

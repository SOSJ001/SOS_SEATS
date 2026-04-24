import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getMonimePaymentApiKeys } from "$lib/server/monimeEnv.js";
import {
  claimFreeTickets,
  type OrderBuyerInput,
  type OrderPaymentInfo,
} from "$lib/services/orders";
import { jsonError } from "$lib/server/apiResponse";

const COMPLETED = new Set(["completed", "paid", "succeeded"]);

type FulfillRequestBody = {
  paymentCodeId?: string;
  eventId?: string;
  paymentMethod?: string;
};

type MonimePaymentCodeResult = {
  status?: string;
  metadata?: Record<string, string | undefined>;
};

type MonimeGetPaymentCodeJson = {
  result?: MonimePaymentCodeResult;
};

/**
 * Verifies a Monime payment code server-side, then records the order.
 * Do not trust client-reported success; Monime is the source of truth.
 */
export const POST: RequestHandler = async (event) => {
  const { request, locals } = event;
  let body: FulfillRequestBody;
  try {
    body = (await request.json()) as FulfillRequestBody;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const paymentCodeId = body.paymentCodeId;
  const eventId = body.eventId;
  const paymentMethod = body.paymentMethod || "orange_money";

  if (!paymentCodeId || !eventId) {
    return jsonError("paymentCodeId and eventId are required", 400);
  }

  const { apiKey, spaceId } = getMonimePaymentApiKeys();
  if (!apiKey || !spaceId) {
    return jsonError("Monime is not configured on the server", 500);
  }

  const monimeRes = await fetch(
    `https://api.monime.io/v1/payment-codes/${paymentCodeId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Monime-Space-Id": spaceId,
        "Monime-Version": "caph.2025-08-23",
      },
    }
  );

  const monimeJson = (await monimeRes
    .json()
    .catch(() => ({}))) as MonimeGetPaymentCodeJson;
  const code = monimeJson?.result;
  if (!monimeRes.ok || !code) {
    return jsonError("Could not verify payment with Monime", 400, {
      details: monimeJson as Record<string, unknown>,
    });
  }

  const status = String(code.status || "").toLowerCase();
  if (!COMPLETED.has(status)) {
    return jsonError(`Payment not complete (status: ${code.status})`, 400);
  }

  const metadata = (code.metadata || {}) as Record<string, string | undefined>;
  if (metadata.event_id && metadata.event_id !== eventId) {
    return jsonError("Event id does not match payment metadata", 400);
  }

  let selectedTickets: Record<string, number> = {};
  try {
    const raw = metadata.selected_tickets;
    if (raw) {
      selectedTickets =
        typeof raw === "string"
          ? (JSON.parse(raw) as Record<string, number>)
          : (raw as Record<string, number>);
    }
  } catch {
    return jsonError("Invalid ticket data in payment metadata", 400);
  }

  if (!Object.keys(selectedTickets).length) {
    return jsonError("No tickets in payment metadata", 400);
  }

  const { supabase } = locals;

  const { data: existingOrder, error: checkError } = await supabase
    .from("orders")
    .select("id, order_number")
    .eq("transaction_hash", paymentCodeId)
    .eq("event_id", eventId)
    .eq("payment_method", paymentMethod)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("fulfill-mobile-money: order check", checkError);
    return jsonError("Could not verify existing orders", 500);
  }

  if (existingOrder) {
    return json({
      success: true,
      data: { orderId: existingOrder.id, duplicate: true },
    });
  }

  const userData: OrderBuyerInput = {
    name: metadata.buyer_name || "Guest",
    wallet_address: metadata.buyer_wallet ?? undefined,
  };

  const paymentInfo: OrderPaymentInfo = {
    paymentMethod,
    transactionSignature: paymentCodeId,
    amount: 0,
    receivingWallet: `monime_${paymentMethod}`,
    buyerWallet: `mobile_money_${paymentMethod}`,
    provider: "monime",
    sessionId: paymentCodeId,
    currency: "SLE",
  };

  const result = await claimFreeTickets(
    eventId,
    selectedTickets,
    userData,
    paymentInfo,
    supabase
  );

  if (result.success) {
    return json({ success: true, data: { orderId: result.orderId } });
  }

  return jsonError(result.error || "Failed to record order", 400);
};

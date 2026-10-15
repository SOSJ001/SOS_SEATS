import { json } from "@sveltejs/kit";
import {
  issuePrivateTicketsWithWallet,
  fulfilPrivateIssuePayment,
  parsePrivateIssueQty,
  privateIssueFeeTotal,
  PRIVATE_ISSUE_FEE_NLE,
  PRIVATE_ISSUE_MAX_QTY,
} from "$lib/server/payments";
import { assertEventOwnedByUser } from "$lib/server/events";

/**
 * POST /api/events/[eventId]/private-issue
 * body: { qty, method: "wallet" | "fulfill", paymentCodeId? }
 * - wallet: take the fee from the NLe balance and create the tickets (fee returned on failure)
 * - fulfill: verify the MM payment code with Monime, then create the tickets once per payment
 */
/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const eventId = params.eventId;
  if (!eventId) {
    return json({ success: false, error: "Event ID required" }, { status: 400 });
  }

  const owned = await assertEventOwnedByUser(eventId, userId);
  if (!owned) {
    return json(
      { success: false, error: "Event not found or unauthorized" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const qty = parsePrivateIssueQty(body?.qty);
  const method = String(body?.method || "wallet");

  if (qty === null) {
    return json(
      {
        success: false,
        error: `Quantity must be a whole number from 1 to ${PRIVATE_ISSUE_MAX_QTY}`,
      },
      { status: 400 }
    );
  }

  const ledgerKey = locals.linkedWalletAddress || locals.walletAddress || null;

  if (method === "wallet") {
    const result = await issuePrivateTicketsWithWallet({
      eventId,
      userId,
      walletAddress: ledgerKey,
      qty,
    });
    if (!result.success) {
      return json({ success: false, error: result.error }, { status: result.status || 400 });
    }
    return json({
      success: true,
      qty: result.qty,
      feeTotal: result.feeTotal,
      feeEach: PRIVATE_ISSUE_FEE_NLE,
      guests: result.guests,
    });
  }

  if (method === "fulfill") {
    const paymentCodeId = String(body?.paymentCodeId || "");
    const result = await fulfilPrivateIssuePayment({
      paymentCodeId,
      userId,
      eventId,
      qty,
      ledgerKey,
    });
    if (!result.success) {
      return json({ success: false, error: result.error }, { status: result.status });
    }
    return json({
      success: true,
      qty: result.qty,
      feeTotal: privateIssueFeeTotal(result.qty),
      feeEach: PRIVATE_ISSUE_FEE_NLE,
      guests: [],
      paymentCodeId,
    });
  }

  return json(
    { success: false, error: "method must be wallet or fulfill" },
    { status: 400 }
  );
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const eventId = params.eventId;
  if (!eventId) {
    return json({ success: false, error: "Event ID required" }, { status: 400 });
  }
  return json({
    success: true,
    feeEach: PRIVATE_ISSUE_FEE_NLE,
    eventId,
  });
}

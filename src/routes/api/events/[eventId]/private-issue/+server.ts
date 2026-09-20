import { json } from "@sveltejs/kit";
import {
  issuePrivateTicketsWithWallet,
  issuePrivateGuests,
  privateIssueFeeTotal,
  PRIVATE_ISSUE_FEE_NLE,
} from "$lib/server/payments";
import { assertEventOwnedByUser } from "$lib/server/events";

/**
 * POST /api/events/[eventId]/private-issue
 * body: { qty, method: "wallet" | "fulfill", paymentCodeId? }
 * - wallet: debit NLe proceeds + insert guests
 * - fulfill: after MM poll paid; insert guests only (payment already taken by Monime)
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

  const qty = Math.floor(Number(body?.qty) || 0);
  const method = String(body?.method || "wallet");
  const feeTotal = privateIssueFeeTotal(qty);

  if (qty < 1) {
    return json(
      { success: false, error: "Quantity must be at least 1" },
      { status: 400 }
    );
  }

  if (method === "wallet") {
    const walletAddress =
      locals.linkedWalletAddress || locals.walletAddress || null;
    const result = await issuePrivateTicketsWithWallet({
      eventId,
      userId,
      walletAddress,
      qty,
    });
    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
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
    // MM path: payment already completed via Monime poll on client
    const result = await issuePrivateGuests({ eventId, userId, qty });
    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({
      success: true,
      qty: result.qty,
      feeTotal: result.feeTotal,
      feeEach: PRIVATE_ISSUE_FEE_NLE,
      guests: result.guests,
      paymentCodeId: body?.paymentCodeId || null,
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

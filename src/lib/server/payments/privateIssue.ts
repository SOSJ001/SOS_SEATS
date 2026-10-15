/**
 * Private ticket issue fee (roadmap 4.5 / FR-41).
 * Fixed gateway fee 0.99 NLe per ticket. No organiser 5% / buyer booking fee.
 * Tickets are created by the issue_private_tickets database function, once per
 * completed fee (wallet) or payment (mobile money) row.
 */
import { getServerSupabase } from "$lib/server/db";
import { insertWalletTransaction, updateWalletTransaction } from "$lib/server/wallet";
import { getWalletSummary } from "$lib/server/wallet/summary";
import { assertPrivateEventOwnedByUser } from "$lib/server/events";
import { fetchPaymentCodeFromMonime } from "./fulfillPaymentCode";
import {
  PRIVATE_ISSUE_FEE_NLE,
  PRIVATE_ISSUE_MAX_QTY,
  privateIssueChargeCents,
  privateIssueFeeTotal,
} from "$lib/privateIssueLimits";

export {
  PRIVATE_ISSUE_FEE_NLE,
  PRIVATE_ISSUE_MAX_QTY,
  privateIssueChargeCents,
  privateIssueFeeTotal,
};
export const PRIVATE_INVITE_TYPE_NAME = "Private Invite";

/** Whole-number quantity in 1..PRIVATE_ISSUE_MAX_QTY, or null. */
export function parsePrivateIssueQty(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > PRIVATE_ISSUE_MAX_QTY) return null;
  return n;
}

/**
 * Organiser NLe balance that can be withdrawn or spent now: released sale money
 * after the 5% platform fee, minus withdrawals and private ticket fees.
 * Returns 0 if the lookup fails, so an error never unlocks money.
 */
export async function getOrganiserNleBalance(
  userId: string,
  walletAddress: string | null | undefined
): Promise<number> {
  try {
    const summary = await getWalletSummary(userId, walletAddress || `user:${userId}`);
    return summary.available;
  } catch (err) {
    console.error("[getOrganiserNleBalance]", err);
    return 0;
  }
}

export type PrivateIssueResult =
  | { success: true; guests: any[]; feeTotal: number; qty: number }
  | { success: false; error: string; status?: number };

/** Run issue_private_tickets for a completed private issue row (safe to repeat). */
async function issueTicketsForRow(
  txId: string
): Promise<{ success: true; issued: number } | { success: false; error: string }> {
  const { data, error } = await getServerSupabase().rpc("issue_private_tickets", {
    p_tx_id: txId,
  });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.success) {
    return {
      success: false,
      error: result?.error_message || error?.message || "Could not create the tickets",
    };
  }
  return { success: true, issued: Number(result.issued) || 0 };
}

/** Flip a wallet fee row to failed, which takes it out of the balance again. */
async function returnWalletFee(row: { id: string; metadata?: any }, reason: string) {
  const { error } = await updateWalletTransaction(row.id, {
    status: "failed",
    metadata: { ...(row.metadata || {}), refund_reason: reason },
  });
  if (error) console.error("[returnWalletFee]", row.id, error);
}

export async function issuePrivateTicketsWithWallet(opts: {
  eventId: string;
  userId: string;
  walletAddress: string | null | undefined;
  qty: number;
}): Promise<PrivateIssueResult> {
  const qty = parsePrivateIssueQty(opts.qty);
  if (qty === null) {
    return {
      success: false,
      error: `Quantity must be a whole number from 1 to ${PRIVATE_ISSUE_MAX_QTY}`,
    };
  }
  const check = await assertPrivateEventOwnedByUser(opts.eventId, opts.userId);
  if (!check.ok) return { success: false, error: check.error, status: check.status };

  const feeTotal = privateIssueFeeTotal(qty);
  const ledgerKey = opts.walletAddress || `user:${opts.userId}`;

  const balance = await getOrganiserNleBalance(opts.userId, opts.walletAddress);
  if (balance < feeTotal) {
    return {
      success: false,
      error: `Not enough available balance (NLe ${balance.toFixed(2)} available, NLe ${feeTotal.toFixed(2)} due)`,
    };
  }

  const { data: row, error } = await insertWalletTransaction({
    wallet_address: ledgerKey,
    type: "withdrawal",
    source: "private_issue",
    status: "completed",
    amount: -Math.abs(feeTotal),
    currency: "NLe",
    metadata: {
      note: `Private ticket issue × ${qty}`,
      purpose: "private_issue",
      event_id: opts.eventId,
      qty,
      fee_each: PRIVATE_ISSUE_FEE_NLE,
      fee_total: feeTotal,
      user_id: opts.userId,
      tickets_issued: false,
    },
  });
  if (error || !row) {
    return { success: false, error: error || "Could not record the fee" };
  }

  // Re-check with the fee saved, so two quick clicks can't both spend the same money.
  let after: number;
  try {
    after = (await getWalletSummary(opts.userId, ledgerKey)).balance;
  } catch (err) {
    console.error("[issuePrivateTicketsWithWallet] balance re-check", err);
    await returnWalletFee(row, "Balance check failed");
    return { success: false, error: "Could not check your balance. Nothing was charged." };
  }
  if (after < 0) {
    await returnWalletFee(row, "Not enough available balance");
    return { success: false, error: "Not enough available balance. Nothing was charged." };
  }

  const issued = await issueTicketsForRow(row.id);
  if (!issued.success) {
    await returnWalletFee(row, issued.error);
    return {
      success: false,
      error: `Tickets could not be created, so NLe ${feeTotal.toFixed(2)} was returned to your available balance. ${issued.error}`,
    };
  }

  return { success: true, guests: [], feeTotal, qty };
}

/**
 * Record a mobile money private issue payment as pending when its Monime code
 * is created, so the attempt exists even if the organiser never pays.
 */
export async function recordPendingPrivateIssuePayment(opts: {
  paymentCodeId: string;
  eventId: string;
  userId: string;
  ledgerKey: string;
  qty: number;
  paymentMethod: string;
}): Promise<{ error: string | null }> {
  const feeTotal = privateIssueFeeTotal(opts.qty);
  const { error } = await insertWalletTransaction({
    wallet_address: opts.ledgerKey,
    type: "private_issue_payment",
    source: "private_issue",
    status: "pending",
    amount: privateIssueChargeCents(opts.qty) / 100,
    currency: "NLe",
    external_id: opts.paymentCodeId,
    metadata: {
      note: `Private ticket issue × ${opts.qty} (mobile money)`,
      purpose: "private_issue",
      event_id: opts.eventId,
      qty: opts.qty,
      fee_each: PRIVATE_ISSUE_FEE_NLE,
      fee_total: feeTotal,
      user_id: opts.userId,
      payment_method: opts.paymentMethod,
      tickets_issued: false,
    },
  });
  return { error };
}

export type FulfilPrivateIssueResult =
  | { success: true; qty: number; eventId: string; alreadyIssued: boolean }
  | { success: false; error: string; status: number; notCompleted?: boolean };

async function findPrivateIssuePayment(paymentCodeId: string) {
  const { data } = await getServerSupabase()
    .from("wallet_transactions")
    .select("id, status, metadata, wallet_address")
    .eq("type", "private_issue_payment")
    .eq("external_id", paymentCodeId)
    .limit(1);
  return data?.[0] ?? null;
}

/**
 * Verify a mobile money private issue payment with Monime, mark its row
 * completed and create the tickets. Safe to call from the browser and the
 * webhook any number of times: one payment creates its tickets once.
 */
export async function fulfilPrivateIssuePayment(opts: {
  paymentCodeId: string;
  /** Signed-in organiser; omitted only for the signature-verified webhook. */
  userId?: string;
  eventId?: string;
  qty?: number;
  ledgerKey?: string | null;
}): Promise<FulfilPrivateIssueResult> {
  const paymentCodeId = String(opts.paymentCodeId || "").trim();
  if (!paymentCodeId) {
    return { success: false, error: "Payment code required", status: 400 };
  }

  const code = await fetchPaymentCodeFromMonime(paymentCodeId);
  if (!code) {
    return { success: false, error: "Payment not found", status: 404 };
  }

  const status = String(code.status || "").toLowerCase();
  if (status !== "completed") {
    return {
      success: false,
      error: "Payment is not completed yet",
      status: 402,
      notCompleted: true,
    };
  }

  const meta = (code.metadata || {}) as Record<string, unknown>;
  const buyerId = String(meta.buyer_id || "");
  const eventId = String(meta.event_id || "");
  const qty = parsePrivateIssueQty(meta.qty);
  if (meta.purpose !== "private_issue" || !buyerId || !eventId || qty === null) {
    return { success: false, error: "Payment does not match this request", status: 403 };
  }
  if (
    (opts.userId && buyerId !== opts.userId) ||
    (opts.eventId && eventId !== opts.eventId) ||
    (opts.qty !== undefined && qty !== opts.qty)
  ) {
    return { success: false, error: "Payment does not match this request", status: 403 };
  }

  const amount = (code.amount || {}) as { value?: number | string };
  const paid = (Number(amount.value) || 0) / 100;
  if (paid + 0.005 < privateIssueFeeTotal(qty)) {
    return { success: false, error: "Payment amount is too low", status: 402 };
  }
  const paidRounded = Math.round(paid * 100) / 100;

  const db = getServerSupabase();
  let row = await findPrivateIssuePayment(paymentCodeId);

  if (row && String(row.metadata?.user_id || "") !== buyerId) {
    return { success: false, error: "Payment does not match this request", status: 403 };
  }

  if (!row) {
    // Codes created before pending rows were recorded.
    const { error } = await insertWalletTransaction({
      wallet_address: opts.ledgerKey || `user:${buyerId}`,
      type: "private_issue_payment",
      source: "private_issue",
      status: "completed",
      amount: paidRounded,
      currency: "NLe",
      external_id: paymentCodeId,
      metadata: {
        note: `Private ticket issue × ${qty} (mobile money)`,
        purpose: "private_issue",
        event_id: eventId,
        qty,
        user_id: buyerId,
        tickets_issued: false,
      },
    });
    if (error && !/duplicate key|one_use_per_private_issue_payment/i.test(error)) {
      return { success: false, error, status: 500 };
    }
    row = await findPrivateIssuePayment(paymentCodeId);
    if (!row) {
      return { success: false, error: "Could not record the payment", status: 500 };
    }
  } else if (row.status !== "completed") {
    // Monime confirmed the money, so this wins over pending, cancelled or expired.
    const { error } = await db
      .from("wallet_transactions")
      .update({
        status: "completed",
        amount: paidRounded,
        metadata: { ...(row.metadata || {}), cancel_reason: null },
      })
      .eq("id", row.id)
      .neq("status", "completed");
    if (error) return { success: false, error: error.message, status: 500 };
  }

  const issued = await issueTicketsForRow(row.id);
  if (!issued.success) {
    return {
      success: false,
      error: `Payment received but the tickets could not be created yet. Try again; you will not be charged twice. ${issued.error}`,
      status: 500,
    };
  }

  return {
    success: true,
    qty,
    eventId,
    alreadyIssued: Boolean(row.metadata?.tickets_issued),
  };
}

export function isPrivateIssuedGuest(guest: {
  status?: string;
  ticketType?: string;
  ticket_type?: string;
  special_requirements?: string | null;
}): boolean {
  const status = String(guest.status || "").toLowerCase();
  const type = String(
    guest.ticketType || guest.ticket_type || ""
  ).toLowerCase();
  const req = String(guest.special_requirements || "").toLowerCase();
  return (
    status === "issued" ||
    type === PRIVATE_INVITE_TYPE_NAME.toLowerCase() ||
    req === "private_issue"
  );
}

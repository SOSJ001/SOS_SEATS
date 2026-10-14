import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getOrganiserNleBalance,
  sendPayout,
  formatSlPhone,
  ledgerStatusForPayout,
  PAYOUT_PROVIDERS,
  type PayoutProvider,
} from "$lib/server/payments";
import {
  getLedgerKey,
  insertWalletTransaction,
  listWalletTransactions,
  updateWalletTransaction,
} from "$lib/server/wallet";
import { calculateWithdrawalFee } from "$lib/fees";

const round2 = (n: number) => Math.round(n * 100) / 100;

const formatNle = (n: number) =>
  `NLe ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const onHoldMessage = (gross: number) =>
  `${formatNle(gross)} is on hold while we check with the mobile money provider. Please contact support before trying again.`;

/**
 * GET /api/wallet/withdraw
 * The signed-in organiser's withdrawable NLe balance and the fees on it.
 */
export const GET: RequestHandler = async ({ locals }) => {
  const userId = locals.userId;
  const ledgerKey = getLedgerKey(locals);
  if (!userId || !ledgerKey) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const available = await getOrganiserNleBalance(userId, ledgerKey);
  return json({
    success: true,
    data: { available, fees: calculateWithdrawalFee(available) },
  });
};

/**
 * POST /api/wallet/withdraw
 * body: { amount?, phone, provider: "orange_money" | "afrimoney" }
 * Pays out `amount` (whole available balance when omitted) minus the 1% mobile
 * money transfer fee (the 5% platform fee was taken at sale). Fees and limits
 * are computed here; `amount` is only checked against the server balance.
 *
 * Every response after the money is reserved carries `outcome`:
 * "sent" | "on_its_way" | "failed" (money back) | "on_hold" (money reserved,
 * Monime gave no clear answer; sync-payouts retries with the same key).
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.userId;
  const ledgerKey = getLedgerKey(locals);
  if (!userId || !ledgerKey) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const provider = String(body?.provider || "") as PayoutProvider;
  if (!(provider in PAYOUT_PROVIDERS)) {
    return json({ success: false, error: "Unknown provider" }, { status: 400 });
  }

  const phone = formatSlPhone(body?.phone);
  if (!phone) {
    return json({ success: false, error: "Enter 8 digits after +232" }, { status: 400 });
  }

  const inFlight = await listWalletTransactions(ledgerKey, {
    type: "withdrawal",
    status: "pending",
    limit: 1,
  });
  if (inFlight.error) {
    return json({ success: false, error: inFlight.error }, { status: 500 });
  }
  if (inFlight.data.length > 0) {
    return json(
      {
        success: false,
        error: "A withdrawal is already in progress. Wait for it to finish first.",
      },
      { status: 409 }
    );
  }

  const available = round2(await getOrganiserNleBalance(userId, ledgerKey));
  const amountGiven = body?.amount !== undefined && body?.amount !== null && body?.amount !== "";
  let gross = available;
  if (amountGiven) {
    const requested = round2(Number(body.amount));
    if (!Number.isFinite(requested) || requested <= 0) {
      return json({ success: false, error: "Enter an amount to withdraw." }, { status: 400 });
    }
    if (requested > available) {
      return json(
        {
          success: false,
          error: `That's more than your available balance (${formatNle(available)})`,
        },
        { status: 400 }
      );
    }
    gross = requested;
  } else if (available <= 0) {
    return json({ success: false, error: "Nothing to withdraw." }, { status: 400 });
  }

  const fees = calculateWithdrawalFee(gross);
  if (fees.netAmount <= 0) {
    return json(
      { success: false, error: "Amount is too small after the transfer fee." },
      { status: 400 }
    );
  }

  const feeMetadata = {
    gross_amount: round2(gross).toFixed(2),
    transfer_fee: round2(fees.monimeFee).toFixed(2),
    final_net_amount: round2(fees.netAmount).toFixed(2),
    fee_model: "sale_5pct",
  };

  // Reserve the money first; the partial unique index rejects a second pending row.
  const reserved = await insertWalletTransaction({
    wallet_address: ledgerKey,
    type: "withdrawal",
    source: "mobile_money",
    amount: -round2(gross),
    currency: "NLe",
    status: "pending",
    metadata: {
      note: "User-initiated withdrawal from wallet page",
      user_id: userId,
      provider,
      phone_number: phone,
      requested_amount: amountGiven ? round2(gross).toFixed(2) : null,
      available_at_request: available.toFixed(2),
      ...feeMetadata,
    },
  });
  if (reserved.error || !reserved.data) {
    const duplicate = /duplicate key|one_pending_withdrawal/i.test(reserved.error || "");
    return json(
      {
        success: false,
        error: duplicate
          ? "A withdrawal is already in progress. Wait for it to finish first."
          : reserved.error || "Could not record the withdrawal",
      },
      { status: duplicate ? 409 : 500 }
    );
  }
  let row = reserved.data;

  const details = {
    id: row.id,
    phone,
    provider,
    currency: "NLe",
    gross: round2(gross),
    platformFee: 0,
    monimeFee: round2(fees.monimeFee),
    transferFee: round2(fees.monimeFee),
    netAmount: round2(fees.netAmount),
  };

  // Store the key and exact request so sync-payouts can retry safely (Monime idempotency).
  const idempotencyKey = `withdrawal-${row.id}`;
  const payoutRequest = {
    amountNle: round2(fees.netAmount),
    provider,
    phone,
    metadata: { withdrawal_id: row.id, user_id: userId, ...feeMetadata },
  };
  const stored = await updateWalletTransaction(
    row.id,
    {
      metadata: {
        ...row.metadata,
        idempotency_key: idempotencyKey,
        payout_request: payoutRequest,
      },
    },
    ledgerKey
  );
  if (stored.error || !stored.data) {
    await updateWalletTransaction(
      row.id,
      { status: "failed", metadata: { ...row.metadata, error: stored.error || "store failed" } },
      ledgerKey
    );
    return json(
      { success: false, error: "Could not start the withdrawal. Nothing was sent." },
      { status: 500 }
    );
  }
  row = stored.data;

  let result: Awaited<ReturnType<typeof sendPayout>>;
  try {
    result = await sendPayout({ ...payoutRequest, idempotencyKey });
  } catch (err) {
    // Monime may or may not have received it, so the row stays pending (money
    // stays reserved) until sync-payouts retries with the same key.
    console.error("Payout request error:", err);
    return json(
      {
        success: false,
        outcome: "on_hold",
        error: onHoldMessage(gross),
        data: { ...details, status: "pending" },
      },
      { status: 502 }
    );
  }

  if (!result.ok) {
    if (result.status >= 500) {
      await updateWalletTransaction(
        row.id,
        { metadata: { ...row.metadata, last_error: result.error } },
        ledgerKey
      );
      return json(
        {
          success: false,
          outcome: "on_hold",
          error: onHoldMessage(gross),
          data: { ...details, status: "pending" },
        },
        { status: 502 }
      );
    }
    await updateWalletTransaction(
      row.id,
      { status: "failed", metadata: { ...row.metadata, error: result.error } },
      ledgerKey
    );
    return json(
      {
        success: false,
        outcome: "failed",
        error: result.error,
        data: { ...details, status: "failed" },
      },
      { status: result.status }
    );
  }

  const payout = result.payout;
  const monimeFees =
    (payout?.fees || []).reduce(
      (sum: number, fee: any) => sum + (Number(fee?.amount?.value) || 0) / 100,
      0
    ) || 0;
  const ledgerStatus = ledgerStatusForPayout(payout);
  const status = ledgerStatus || "pending";

  await updateWalletTransaction(
    row.id,
    {
      status,
      external_id: payout?.id || null,
      metadata: {
        ...row.metadata,
        payout_id: payout?.id || null,
        payout_status: payout?.status || null,
        monime_fees: monimeFees.toFixed(2),
        monime_response: payout,
      },
    },
    ledgerKey
  );

  if (status === "failed") {
    return json(
      {
        success: false,
        outcome: "failed",
        error:
          payout?.failureDetail?.message ||
          "The mobile money provider rejected this withdrawal.",
        data: { ...details, status },
      },
      { status: 400 }
    );
  }

  return json({
    success: true,
    outcome: status === "completed" ? "sent" : "on_its_way",
    data: { ...details, status, payoutStatus: payout?.status || null },
  });
};

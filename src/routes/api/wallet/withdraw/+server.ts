import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getOrganiserNleBalance,
  sendPayout,
  formatSlPhone,
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
 * POST /api/wallet/withdraw  body: { phone, provider: "orange_money" | "afrimoney" }
 * Pays out the organiser's full available balance minus the 1% mobile money
 * transfer fee (the 5% platform fee was taken at sale). Amounts are computed
 * here; nothing money-related is taken from the request.
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
    return json(
      {
        success: false,
        error: "Phone number must be in the format +232XXXXXXXX (8 digits after +232).",
      },
      { status: 400 }
    );
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

  const gross = await getOrganiserNleBalance(userId, ledgerKey);
  const fees = calculateWithdrawalFee(gross);
  if (gross <= 0 || fees.netAmount <= 0) {
    return json(
      { success: false, error: "Nothing to withdraw after fees." },
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
  const row = reserved.data;

  let result: Awaited<ReturnType<typeof sendPayout>>;
  try {
    result = await sendPayout({
      amountNle: round2(fees.netAmount),
      provider,
      phone,
      metadata: { withdrawal_id: row.id, user_id: userId, ...feeMetadata },
    });
  } catch (err) {
    // Monime may or may not have received it, so the row stays pending (money
    // stays reserved) until someone checks the Monime dashboard.
    console.error("Payout request error:", err);
    return json(
      {
        success: false,
        error:
          "We could not confirm the payout with Monime. Your balance is on hold; contact support before trying again.",
      },
      { status: 502 }
    );
  }

  if (!result.ok) {
    await updateWalletTransaction(
      row.id,
      { status: "failed", metadata: { ...row.metadata, error: result.error } },
      ledgerKey
    );
    return json({ success: false, error: result.error }, { status: result.status });
  }

  const payout = result.payout;
  const monimeFees =
    (payout?.fees || []).reduce(
      (sum: number, fee: any) => sum + (Number(fee?.amount?.value) || 0) / 100,
      0
    ) || 0;
  const status = payout?.status === "completed" ? "completed" : "pending";

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

  return json({
    success: true,
    data: {
      id: row.id,
      status,
      payoutStatus: payout?.status || null,
      phone,
      currency: "NLe",
      gross: round2(gross),
      platformFee: 0,
      monimeFee: round2(fees.monimeFee),
      transferFee: round2(fees.monimeFee),
      netAmount: round2(fees.netAmount),
    },
  });
};

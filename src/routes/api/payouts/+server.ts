import type { RequestHandler } from "./$types";
import { getMonimePayoutApiKeys } from "$lib/server/monimeEnv";
import { getAvailableMobileMoneyBalance } from "$lib/server/merchantBalance";
import { postMonimePayout } from "$lib/server/monimePayout";
import { jsonError, jsonSuccess } from "$lib/server/apiResponse";
import { requireSessionOr401 } from "$lib/server/requireSession";

const BALANCE_EPSILON = 0.01;

type PayoutsBody = {
  wallet_address: string;
  amount: { currency: string; value: number };
  destination: { providerCode: string; accountId: string };
  source?: { financialAccountId?: string };
  metadata?: Record<string, unknown>;
  reference?: string;
};

/**
 * Session-gated merchant payout: verifies available mobile-money balance in DB
 * before calling Monime (see docs/API_CONTRACT.md).
 */
export const POST: RequestHandler = async (event) => {
  const auth = requireSessionOr401(event);
  if (!auth.ok) {
    return auth.response;
  }

  const { supabase } = event.locals;

  let body: PayoutsBody;
  try {
    body = (await event.request.json()) as PayoutsBody;
  } catch {
    return jsonError("Invalid JSON body", 400, { code: "INVALID_BODY" });
  }

  if (!body.wallet_address || typeof body.wallet_address !== "string") {
    return jsonError(
      "wallet_address is required to verify your balance against withdrawals.",
      400,
      { code: "WALLET_ADDRESS_REQUIRED" }
    );
  }

  if (!body.amount?.currency || body.amount.value === undefined || body.amount.value === null) {
    return jsonError("amount.currency and amount.value are required", 400, {
      code: "INVALID_AMOUNT",
    });
  }

  if (
    !body.destination?.providerCode ||
    !body.destination?.accountId
  ) {
    return jsonError(
      "destination.providerCode and destination.accountId are required",
      400,
      { code: "INVALID_DESTINATION" }
    );
  }

  if (typeof body.amount.value !== "number" || !Number.isFinite(body.amount.value)) {
    return jsonError("amount.value must be a finite number", 400, {
      code: "INVALID_AMOUNT",
    });
  }

  if (body.amount.value <= 0) {
    return jsonError("amount.value must be positive", 400, {
      code: "INVALID_AMOUNT",
    });
  }

  const { available } = await getAvailableMobileMoneyBalance(
    supabase,
    auth.user_Id,
    body.wallet_address.trim()
  );

  if (body.amount.value > available + BALANCE_EPSILON) {
    return jsonError(
      `Insufficient available balance. Available: NLe ${available.toFixed(2)}, requested: ${body.amount.value.toFixed(2)}.`,
      403,
      { code: "INSUFFICIENT_BALANCE", available, requested: body.amount.value }
    );
  }

  const { apiKey, spaceId } = getMonimePayoutApiKeys();
  if (!apiKey || !spaceId) {
    return jsonError("Monime payout credentials not configured", 500, {
      code: "MONIME_NOT_CONFIGURED",
    });
  }

  const meta: Record<string, unknown> = {
    ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
    user_id: auth.user_Id,
    wallet_address: body.wallet_address.trim(),
  };

  const result = await postMonimePayout(
    {
      amount: body.amount,
      destination: body.destination,
      source: body.source,
      metadata: meta,
      reference: body.reference,
    },
    apiKey,
    spaceId
  );

  if (!result.success) {
    return jsonError(result.error, result.status, {
      code: "MONIME_PAYOUT_FAILED",
      ...(result.isInfrastructureError != null
        ? { isInfrastructureError: result.isInfrastructureError }
        : {}),
    });
  }

  return jsonSuccess(result.data);
};

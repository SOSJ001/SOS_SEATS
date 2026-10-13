import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/** Multisig withdrawals are switched off; all payouts go through /api/wallet/withdraw. */
export const POST: RequestHandler = async () =>
  json(
    { success: false, error: "Multisig withdrawals are turned off." },
    { status: 410 }
  );

import { error } from "@sveltejs/kit";
import { loadTransferReceipt } from "$lib/server/tickets/transfers";

/**
 * Transfer receipt (roadmap 6.2b / FR-21e), Transfer Successful HI-FI 527:343 / mobile 311:265.
 * Sender only: anyone else gets a 404.
 */
export async function load({ locals, params }) {
  const receipt = locals.userId
    ? await loadTransferReceipt(locals.userId, params.transferId)
    : null;

  if (!receipt) {
    throw error(404, "Transfer receipt not found");
  }

  return { receipt };
}

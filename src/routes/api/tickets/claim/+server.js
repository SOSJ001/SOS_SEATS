import { json } from "@sveltejs/kit";
import {
  claimTickets,
  findOrderByTransactionHash,
} from "$lib/server/tickets";

/**
 * Marketplace claim path (FR-17). Auth required.
 * Webhook fulfill calls claimTickets in-process, not this HTTP route.
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, locals }) {
  try {
    if (!locals.userId) {
      return json(
        { success: false, error: "Sign in required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, selectedTickets, paymentInfo } = body;
    let { userData } = body;

    if (!eventId || !selectedTickets || !userData) {
      return json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    userData = { ...userData, id: locals.userId };
    if (locals.walletAddress) {
      userData.wallet_address =
        userData.wallet_address || locals.walletAddress;
    }

    if (paymentInfo?.transactionSignature) {
      const existing = await findOrderByTransactionHash(
        paymentInfo.transactionSignature,
        eventId,
        paymentInfo.paymentMethod
      );
      if (existing) {
        return json({
          success: true,
          orderId: existing.id,
          orderNumber: existing.order_number,
          ticketsClaimed: 0,
          message: "Order already exists",
        });
      }
    }

    const result = await claimTickets(
      eventId,
      selectedTickets,
      userData,
      paymentInfo || null
    );

    if (!result.success) {
      return json({ success: false, error: result.error }, { status: 400 });
    }

    return json(result);
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Claim failed",
      },
      { status: 500 }
    );
  }
}

import { json } from "@sveltejs/kit";
import {
  claimTickets,
  findOrderByTransactionHash,
} from "$lib/server/tickets";

/**
 * Public marketplace / payment fulfill path.
 * Auth optional (guest checkout); ownership of ticket types enforced by public event + DEFINER RPCs via service role.
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { eventId, selectedTickets, userData, paymentInfo } = body;

    if (!eventId || !selectedTickets || !userData) {
      return json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
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

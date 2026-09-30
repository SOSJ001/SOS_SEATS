import { json } from "@sveltejs/kit";
import {
  loadTransferTicket,
  validateTransferRecipient,
  transferTicket,
} from "$lib/server/tickets/transfers";

/**
 * Transfer by username (roadmap 6.2 / 6.2b, FR-21). Auth required.
 * Pre-checks give friendly messages; transfer_order_item re-checks everything under a row lock.
 * 400 = input format (inline), 404 = not the holder's transferable ticket, 409 = rule failure (failed state).
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

    const body = await request.json().catch(() => ({}));
    const ticketId = typeof body?.ticketId === "string" ? body.ticketId : "";
    const recipient = typeof body?.recipient === "string" ? body.recipient : "";

    if (!ticketId || !recipient.trim()) {
      return json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const ticket = await loadTransferTicket(
      locals.userId,
      locals.userName || "Attendee",
      ticketId
    );
    if (!ticket) {
      return json(
        { success: false, error: "This ticket can't be transferred" },
        { status: 404 }
      );
    }

    const check = await validateTransferRecipient({
      userId: locals.userId,
      web3UserId: locals.web3UserId || null,
      raw: recipient,
    });
    if (!check.ok) {
      return json(
        { success: false, code: check.code, error: check.error },
        { status: check.code === "invalid_username" ? 400 : 409 }
      );
    }

    const result = await transferTicket({
      userId: locals.userId,
      ticketId: ticket.id,
      username: check.username,
    });
    if (!result.ok) {
      return json(
        { success: false, code: result.code, error: result.error },
        { status: result.status }
      );
    }

    return json({
      success: true,
      transferId: result.transferId,
      reference: result.reference,
      recipient: result.recipient,
    });
  } catch (error) {
    console.error("Ticket transfer failed:", error);
    return json(
      { success: false, error: "Transfer failed. Please try again." },
      { status: 500 }
    );
  }
}

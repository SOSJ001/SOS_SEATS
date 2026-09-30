import { json } from "@sveltejs/kit";
import {
  loadTransferTicket,
  validateTransferRecipient,
} from "$lib/server/tickets/transfers";

/**
 * Transfer by username (roadmap 6.2 / FR-21). Auth required.
 * Checks ticket eligibility and the recipient only; nothing is written yet.
 * Roadmap 6.2b replaces the success branch with the atomic transfer RPC.
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
      return json({ success: false, error: check.error }, { status: 400 });
    }

    return json({ success: true, recipient: check.username });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Transfer check failed",
      },
      { status: 500 }
    );
  }
}

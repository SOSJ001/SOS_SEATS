import { json } from "@sveltejs/kit";
import { claimTickets } from "$lib/server/tickets";
import { getServerSupabase } from "$lib/server/db";
import { isEventOnSale } from "$lib/server/events/onSale";
import { getMaxPerOrder } from "$lib/server/events/settings";

const MAX_PER_TYPE = 50;

/**
 * Marketplace free-claim path (FR-17). Auth required.
 * Free tickets only: paid orders come from the verified Monime webhook,
 * which calls claimTickets in-process, never through this route.
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
    const { eventId, selectedTickets } = body;
    let { userData } = body;

    if (!eventId || !selectedTickets || !userData) {
      return json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    /** @type {Record<string, number>} */
    const quantities = {};
    for (const [id, raw] of Object.entries(selectedTickets)) {
      const qty = Math.floor(Number(raw) || 0);
      if (qty < 0 || qty > MAX_PER_TYPE) {
        return json(
          { success: false, error: "Invalid ticket quantity" },
          { status: 400 }
        );
      }
      if (qty > 0) quantities[String(id)] = qty;
    }
    const ids = Object.keys(quantities);
    if (ids.length === 0) {
      return json(
        { success: false, error: "Select at least one ticket" },
        { status: 400 }
      );
    }

    const db = getServerSupabase();
    const { data: event } = await db
      .from("events")
      .select("id, status, event_visibility")
      .eq("id", eventId)
      .maybeSingle();
    if (!isEventOnSale(event)) {
      return json(
        { success: false, error: "Event not available" },
        { status: 404 }
      );
    }

    const maxPerOrder = await getMaxPerOrder(eventId);
    if (Object.values(quantities).some((qty) => qty > maxPerOrder)) {
      return json(
        {
          success: false,
          error: `You can take at most ${maxPerOrder} of each ticket type per order`,
        },
        { status: 400 }
      );
    }

    const { data: types, error: typesError } = await db
      .from("ticket_types")
      .select("id, price, is_active")
      .eq("event_id", eventId)
      .in("id", ids);
    if (typesError || !types || types.length !== ids.length) {
      return json(
        { success: false, error: "Ticket type not found for this event" },
        { status: 400 }
      );
    }
    if (types.some((t) => t.is_active === false)) {
      return json(
        { success: false, error: "Ticket type not available" },
        { status: 400 }
      );
    }
    if (types.some((t) => (parseFloat(String(t.price)) || 0) > 0)) {
      return json(
        { success: false, error: "Paid tickets must be bought through checkout" },
        { status: 400 }
      );
    }

    userData = {
      ...userData,
      id: locals.userId,
      wallet_address: locals.walletAddress || null,
    };

    const result = await claimTickets(eventId, quantities, userData, null);

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

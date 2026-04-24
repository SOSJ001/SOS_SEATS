import type { RequestHandler } from "./$types";
import { jsonError, jsonSuccess } from "$lib/server/apiResponse";
import { requireSessionOr401 } from "$lib/server/requireSession";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_RE.test(value.trim());
}

function isLikelySolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(value.trim());
}

type VerifyBody = {
  event_id: string;
  scan: string;
  check_in_location?: string | null;
};

/**
 * POST /api/tickets/verify
 * Organizer-only: session user must own `event_id`. Delegates check-in to existing RPCs
 * (`check_in_guest`, `validate_and_check_in_ticket`) used by the dashboard scanner.
 */
export const POST: RequestHandler = async (event) => {
  const auth = requireSessionOr401(event);
  if (!auth.ok) {
    return auth.response;
  }

  const { supabase } = event.locals;

  let body: VerifyBody;
  try {
    body = (await event.request.json()) as VerifyBody;
  } catch {
    return jsonError("Invalid JSON body", 400, { code: "INVALID_BODY" });
  }

  const eventId = body.event_id?.trim();
  const scan = body.scan?.trim();
  if (!eventId || !isUuid(eventId)) {
    return jsonError("event_id must be a valid UUID", 400, { code: "INVALID_EVENT_ID" });
  }
  if (!scan) {
    return jsonError("scan is required (guest id or wallet address)", 400, {
      code: "MISSING_SCAN",
    });
  }

  const { data: owned, error: ownErr } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", auth.user_Id)
    .maybeSingle();

  if (ownErr) {
    return jsonError(ownErr.message || "Failed to verify event access", 500, {
      code: "EVENT_LOOKUP_FAILED",
    });
  }
  if (!owned) {
    return jsonError("You can only verify tickets for events you organize.", 403, {
      code: "NOT_EVENT_ORGANIZER",
    });
  }

  const location = body.check_in_location?.trim() || null;

  if (isUuid(scan)) {
    const guestId = scan;
    const { data: guestRow, error: guestErr } = await supabase
      .from("guests")
      .select(
        "id, event_id, status, check_in_time, first_name, last_name, ticket_type_id"
      )
      .eq("id", guestId)
      .maybeSingle();

    if (guestErr || !guestRow) {
      return jsonError(
        "Invalid ticket or invite code. Guest not found.",
        404,
        { code: "INVALID_QR" }
      );
    }

    if (guestRow.event_id !== eventId) {
      return jsonError("This ticket is not valid for the selected event.", 400, {
        code: "WRONG_EVENT",
      });
    }

    if (guestRow.check_in_time) {
      return jsonError(
        "This ticket has already been checked in.",
        409,
        {
          code: "ALREADY_CHECKED_IN",
          checked_in_at: guestRow.check_in_time,
        }
      );
    }

    if (guestRow.status && guestRow.status !== "confirmed") {
      return jsonError(
        `Ticket cannot be checked in. Status: ${guestRow.status}`,
        400,
        { code: "INVALID_TICKET_STATUS" }
      );
    }

    const { data: rpcData, error: rpcErr } = await supabase.rpc("check_in_guest", {
      p_guest_id: guestId,
      p_check_in_location: location,
    });

    if (rpcErr) {
      return jsonError(rpcErr.message || "Check-in failed", 500, {
        code: "CHECK_IN_FAILED",
      });
    }

    const row = rpcData?.[0];
    if (!row?.success) {
      return jsonError(row?.message || "Guest not found or already checked in", 400, {
        code: "CHECK_IN_REJECTED",
      });
    }

    return jsonSuccess({
      route: "guest" as const,
      guest_id: guestId,
      message: row.message,
    });
  }

  if (!isLikelySolanaAddress(scan)) {
    return jsonError(
      "Unrecognized scan format. Expected guest UUID or Solana wallet address.",
      400,
      { code: "INVALID_QR" }
    );
  }

  const { data: rpcRows, error: rpcErr } = await supabase.rpc(
    "validate_and_check_in_ticket",
    {
      p_wallet_address: scan,
      p_event_id: eventId,
      p_check_in_location: location,
    }
  );

  if (rpcErr) {
    return jsonError(rpcErr.message || "Validation failed", 500, {
      code: "CHECK_IN_FAILED",
    });
  }

  const result = rpcRows?.[0];
  if (!result) {
    return jsonError("No response from ticket validation", 500, {
      code: "CHECK_IN_FAILED",
    });
  }

  if (!result.success) {
    const msg = String(result.message || "");
    const code = msg.toLowerCase().includes("already checked in")
      ? "ALREADY_CHECKED_IN"
      : msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("not found")
        ? "INVALID_QR"
        : "CHECK_IN_REJECTED";
    return jsonError(msg, 400, { code });
  }

  return jsonSuccess({
    route: "wallet" as const,
    ticket_info: result.ticket_info,
    message: result.message,
  });
};

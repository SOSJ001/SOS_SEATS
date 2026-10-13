/**
 * Door validate / check-in (roadmap 7.1, FR-22 to FR-24).
 * Scans by guests.qr_token only; the scan_guest_ticket RPC (service role only) re-checks
 * everything under row locks and checks in guests + order_items in one transaction.
 * The token is a secret (Data Model): never log it or echo it back.
 */
import { json, type RequestEvent } from "@sveltejs/kit";
import { getServerSupabase } from "$lib/server/db";
import { canScanEvent } from "$lib/server/staff";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{32}$/;
const LOCATION_MAX = 120;

export type ScanCode =
  | "valid"
  | "checked_in"
  | "invalid_token"
  | "not_found"
  | "wrong_event"
  | "already_checked_in"
  | "not_admissible";

export type ScanTicketInfo = {
  holderName: string;
  ticketType: string;
  ticketNumber: string | null;
};

export type ScanResult =
  | {
      ok: true;
      code: "valid" | "checked_in";
      ticket: ScanTicketInfo;
      checkedInAt: string | null;
    }
  | {
      ok: false;
      code: Exclude<ScanCode, "valid" | "checked_in">;
      status: 400 | 404 | 409;
      message: string;
      /** Only for already_checked_in (7.2), so the door can see who used it. */
      ticket: ScanTicketInfo | null;
      checkedInAt: string | null;
    };

const SCAN_ERRORS: Record<
  Exclude<ScanCode, "valid" | "checked_in">,
  { status: 400 | 404 | 409; message: string }
> = {
  invalid_token: { status: 400, message: "This QR code isn't a SOS SEATS ticket." },
  not_found: {
    status: 404,
    message: "Ticket not recognised. It may have been transferred.",
  },
  wrong_event: { status: 409, message: "This ticket is for a different event." },
  already_checked_in: { status: 409, message: "Already checked in." },
  not_admissible: { status: 409, message: "This ticket can't be used for entry." },
};

export function normalizeScanToken(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function normalizeScanLocation(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, LOCATION_MAX);
  return trimmed || null;
}

/** Validate (commit false) or check in (commit true) one ticket for an event. */
export async function scanTicket(opts: {
  eventId: string;
  token: string;
  commit: boolean;
  location?: string | null;
}): Promise<ScanResult> {
  const db = getServerSupabase();
  const { data, error } = await db.rpc("scan_guest_ticket", {
    p_event_id: opts.eventId,
    p_token: opts.token,
    p_commit: opts.commit,
    p_location: opts.location ?? null,
  });

  if (error) {
    throw new Error(error.message || "Scan failed");
  }

  const res = (data || {}) as Record<string, any>;
  const checkedInAt = res.checked_in_at ? String(res.checked_in_at) : null;

  if (res.ok && (res.code === "valid" || res.code === "checked_in")) {
    return {
      ok: true,
      code: res.code,
      ticket: toTicketInfo(res.ticket),
      checkedInAt,
    };
  }

  const code = (
    res.code in SCAN_ERRORS ? res.code : "not_admissible"
  ) as Exclude<ScanCode, "valid" | "checked_in">;
  const ticket =
    code === "already_checked_in" && res.ticket ? toTicketInfo(res.ticket) : null;
  return { ok: false, code, ...SCAN_ERRORS[code], ticket, checkedInAt };
}

function toTicketInfo(raw: any): ScanTicketInfo {
  const t = raw || {};
  return {
    holderName: String(t.holder_name || ""),
    ticketType: String(t.ticket_type || "Ticket"),
    ticketNumber: t.ticket_number ? String(t.ticket_number) : null,
  };
}

/**
 * Shared POST handler for /api/scanner/validate and /api/scanner/check-in.
 * Body: { eventId, token, location? }. The event owner or door staff assigned to it.
 */
export async function handleScanRequest(
  { request, locals }: Pick<RequestEvent, "request" | "locals">,
  commit: boolean
): Promise<Response> {
  try {
    const userId = (locals as any)?.userId as string | undefined;
    if (!userId) {
      return json(
        { success: false, code: "unauthorized", message: "Sign in required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    if (!UUID_RE.test(eventId)) {
      return json(
        { success: false, code: "invalid_event", message: "eventId required" },
        { status: 400 }
      );
    }

    const allowed = await canScanEvent(
      eventId,
      userId,
      (locals as any)?.sessionType ?? null
    );
    if (!allowed) {
      return json(
        { success: false, code: "forbidden", message: "Unauthorized" },
        { status: 403 }
      );
    }

    const token = normalizeScanToken(body?.token);
    if (!TOKEN_RE.test(token)) {
      const { status, message } = SCAN_ERRORS.invalid_token;
      return json({ success: false, code: "invalid_token", message }, { status });
    }

    const result = await scanTicket({
      eventId,
      token,
      commit,
      location: normalizeScanLocation(body?.location),
    });

    if (!result.ok) {
      return json(
        {
          success: false,
          code: result.code,
          message: result.message,
          ticket: result.ticket,
          checkedInAt: result.checkedInAt,
        },
        { status: result.status }
      );
    }

    return json({
      success: true,
      code: result.code,
      ticket: result.ticket,
      checkedInAt: result.checkedInAt,
    });
  } catch (error: any) {
    console.error("Scanner request failed:", error?.message || "unknown error");
    return json(
      { success: false, code: "server_error", message: "Scan failed. Please try again." },
      { status: 500 }
    );
  }
}

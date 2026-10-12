/**
 * Maps /api/scanner/validate and /check-in responses to what the door shows (roadmap 7.2).
 * "Valid - Unused" and "Checked In" stay distinct: validating never implies check-in.
 */

/** @type {Record<string, string>} */
const INVALID_HEADLINES = {
  already_checked_in: "Invalid - Already Used",
  wrong_event: "Invalid - Wrong Event",
  not_found: "Invalid - Not Recognised",
  not_admissible: "Invalid - Not Valid for Entry",
  invalid_token: "Invalid - Not a SOS SEATS Ticket",
};

/**
 * @param {number} status HTTP status
 * @param {any} body JSON body (may be null)
 * @returns {{ kind: "valid" | "checked_in" | "invalid", code: string, headline: string, message: string, ticket: any, checkedInAt: string | null }}
 */
export function toScanResult(status, body) {
  const code = body?.code || "";
  const ticket = body?.ticket || null;
  const checkedInAt = body?.checkedInAt || null;

  if (body?.success && code === "valid") {
    return {
      kind: "valid",
      code,
      headline: "Valid - Unused",
      message: "This ticket is valid and hasn't been used.",
      ticket,
      checkedInAt: null,
    };
  }
  if (body?.success && code === "checked_in") {
    return {
      kind: "checked_in",
      code,
      headline: "Checked In",
      message: "Guest checked in. Admit them and scan the next ticket.",
      ticket,
      checkedInAt,
    };
  }
  if (INVALID_HEADLINES[code]) {
    return {
      kind: "invalid",
      code,
      headline: INVALID_HEADLINES[code],
      message: body?.message || "This ticket can't be used for entry.",
      ticket: code === "already_checked_in" ? ticket : null,
      checkedInAt: code === "already_checked_in" ? checkedInAt : null,
    };
  }

  let message = body?.message || "Scan failed. Please try again.";
  if (status === 401) message = "Your session has expired. Sign in again to keep scanning.";
  else if (status === 403) message = "You can't scan tickets for this event.";
  return {
    kind: "invalid",
    code: code || "server_error",
    headline: "Scan Failed",
    message,
    ticket: null,
    checkedInAt: null,
  };
}

export function networkErrorResult() {
  return {
    kind: "invalid",
    code: "network_error",
    headline: "Scan Failed",
    message: "Couldn't reach the server. Check your connection and try again.",
    ticket: null,
    checkedInAt: null,
  };
}

/**
 * Private events are invite only: tickets come from Generate, not the marketplace.
 * @param {{ event_visibility?: string | null } | null | undefined} event
 */
export function isPrivateEvent(event) {
  return String(event?.event_visibility || "public").toLowerCase() === "private";
}

/**
 * The hidden ticket type private invites are issued on (quantity 999999, never sellable).
 * @param {unknown} name
 */
export function isPrivateInviteName(name) {
  return String(name || "").trim().toLowerCase() === "private invite";
}

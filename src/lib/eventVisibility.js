/**
 * Private events are invite only: tickets come from Generate, not the marketplace.
 * @param {{ event_visibility?: string | null } | null | undefined} event
 */
export function isPrivateEvent(event) {
  return String(event?.event_visibility || "public").toLowerCase() === "private";
}

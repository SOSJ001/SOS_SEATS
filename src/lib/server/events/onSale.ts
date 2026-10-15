/** Buyers may only quote or claim tickets for public events that are published or live. */
export function isEventOnSale(
  event: { status?: string | null; event_visibility?: string | null } | null | undefined
): boolean {
  if (!event) return false;
  const status = String(event.status || "").toLowerCase();
  const visibility = String(event.event_visibility || "public").toLowerCase();
  return (status === "published" || status === "live") && visibility === "public";
}

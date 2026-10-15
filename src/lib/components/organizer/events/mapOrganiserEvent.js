// @ts-nocheck
/**
 * Maps a `loadUserEvents` row to the shape used by OrganiserEventCard and the
 * dashboard / events list stats.
 */

export const isActiveStatus = (status) => status === "published" || status === "live";

/**
 * A public link only opens for public events that are published or live
 * (anon cannot read drafts or private events). Private events are invite only.
 * @param {{ status?: string, dbStatus?: string, event_visibility?: string } | null | undefined} event
 */
export function canShareEvent(event) {
  if (!event) return false;
  const status = String(event.dbStatus || event.status || "").toLowerCase();
  return (event.event_visibility || "public") === "public" && isActiveStatus(status);
}

/** Today as YYYY-MM-DD in Sierra Leone time (same rule as the door scanner). */
export function todayInFreetown(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Freetown",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True when the event's day is before today; events stay current for their whole day. */
export function isPastDate(date, today = todayInFreetown()) {
  return !!date && String(date).slice(0, 10) < today;
}

/** "Apr 12 · 18:00" (or "Apr 12" without a time). */
export function formatEventDate(date, time) {
  if (!date) return "Date not set";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Date not set";
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return time ? `${day} · ${String(time).slice(0, 5)}` : day;
}

export function mapOrganiserEvent(event) {
  const types = event.ticket_types || [];
  const stats = event.realTimeStats;
  const ticketsSold = stats
    ? Number(stats.totalTicketsSold) || 0
    : types.reduce((sum, t) => sum + (Number(t.sold_quantity) || 0), 0);
  const revenueValue = stats
    ? Number(stats.totalRevenue) || 0
    : types.reduce((sum, t) => sum + (Number(t.price) || 0) * (Number(t.sold_quantity) || 0), 0);
  const capacity =
    Number(event.total_capacity) ||
    types.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

  const rawStatus = (event.status || "draft").toLowerCase();
  const isPast = isPastDate(event.date);

  return {
    id: event.id,
    title: event.name || "Untitled event",
    date: formatEventDate(event.date, event.time),
    location: event.location || "",
    image: event.image?.file_path || null,
    // Display-only: past published/live events read as ended. The database status is unchanged.
    status: isPast && isActiveStatus(rawStatus) ? "completed" : rawStatus,
    dbStatus: rawStatus,
    event_visibility: event.event_visibility || "public",
    isPast,
    ticketsSold,
    capacity,
    revenueValue,
    createdAt: event.created_at || null,
  };
}

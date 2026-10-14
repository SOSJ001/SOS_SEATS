// @ts-nocheck
/**
 * Maps a `loadUserEvents` row to the shape used by OrganiserEventCard and the
 * dashboard / events list stats.
 */

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

  return {
    id: event.id,
    title: event.name || "Untitled event",
    date: formatEventDate(event.date, event.time),
    location: event.location || "",
    image: event.image?.file_path || null,
    status: (event.status || "draft").toLowerCase(),
    ticketsSold,
    capacity,
    revenueValue,
    createdAt: event.created_at || null,
  };
}

export const isActiveStatus = (status) => status === "published" || status === "live";

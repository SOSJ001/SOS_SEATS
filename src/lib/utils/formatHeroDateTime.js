// @ts-nocheck
/**
 * Event hero date line, e.g. "Sat, Apr 12 · 6:00 PM".
 * @param {string | null | undefined} date ISO date (YYYY-MM-DD)
 * @param {string | null | undefined} time HH:MM or HH:MM:SS
 * @param {string} [fallback] returned when there is no date
 * @returns {string}
 */
export function formatHeroDateTime(date, time, fallback = "") {
  if (!date) return fallback;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!time) return datePart;
  try {
    const iso = `${date}T${time.length === 5 ? `${time}:00` : time}`;
    const t = new Date(iso);
    if (!Number.isNaN(t.getTime())) {
      const timePart = t.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${datePart} · ${timePart}`;
    }
  } catch {
    /* ignore */
  }
  return `${datePart} · ${time}`;
}

/** Door (roadmap 7.2) display helpers. Times are shown in Freetown time. */
const TIME_ZONE = "Africa/Freetown";

/** @param {Date} d */
function dayKey(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * "Apr 12 · 18:00" from events.date (YYYY-MM-DD) + events.time (HH:MM:SS).
 * @param {string | null | undefined} date
 * @param {string | null | undefined} time
 */
export function formatEventDateTime(date, time) {
  const parts = [];
  if (date) {
    const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
        }).format(d)
      );
    }
  }
  if (time) parts.push(String(time).slice(0, 5));
  return parts.join(" · ") || "Date to be announced";
}

/**
 * "18:24" in Freetown time.
 * @param {string | null | undefined} iso
 */
export function formatClock(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * "Today 18:24 (12 mins ago)" / "Oct 11 18:24".
 * @param {string | null | undefined} iso
 */
export function formatCheckedInAt(iso, now = new Date()) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const sameDay = dayKey(d) === dayKey(now);
  const day = sameDay
    ? "Today"
    : new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
      }).format(d);
  const base = `${day} ${formatClock(iso)}`;
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 0 || mins >= 24 * 60) return base;
  if (mins < 1) return `${base} (just now)`;
  if (mins < 60) return `${base} (${mins} min${mins === 1 ? "" : "s"} ago)`;
  const hrs = Math.floor(mins / 60);
  return `${base} (${hrs} hr${hrs === 1 ? "" : "s"} ago)`;
}

/**
 * "18:24" for today, "Oct 11 18:24" for earlier days.
 * @param {string | null | undefined} iso
 */
export function formatScanTime(iso, now = new Date()) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  if (dayKey(d) === dayKey(now)) return formatClock(iso);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(d);
  return `${day} ${formatClock(iso)}`;
}

/**
 * @param {number} part
 * @param {number} total
 */
export function percent(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

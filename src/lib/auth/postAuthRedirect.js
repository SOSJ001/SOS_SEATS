/**
 * Post-auth redirect + auth query helpers (roadmap 2.5 / FR-39).
 * Role is surface routing, not a permanent account type.
 */

const ROLE_DEFAULTS = {
  attendee: "/dashboard/my-tickets",
  organizer: "/dashboard",
  staff: "/dashboard/staff",
};

/**
 * @param {string | null | undefined} raw
 * @param {string | null | undefined} [role]
 * @returns {string}
 */
export function safeNext(raw, role) {
  const fallback = ROLE_DEFAULTS[role] || "/dashboard";
  if (!raw || typeof raw !== "string") return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

/**
 * @param {{ next?: string | null; role?: string | null }} [opts]
 * @returns {string} query string including leading `?`, or empty
 */
export function authSearchParams(opts = {}) {
  const params = new URLSearchParams();
  const next = opts.next;
  const role = opts.role;
  if (next && typeof next === "string" && next.trim()) {
    params.set("next", next.trim());
  }
  if (role === "attendee" || role === "organizer" || role === "staff") {
    params.set("role", role);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

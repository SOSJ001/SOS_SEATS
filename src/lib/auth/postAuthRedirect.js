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

const EVENT_PATH = /^\/marketplace\/eventDetails\/([^/?#]+)/;

/**
 * Where "Back" on an auth page goes: the event the user came from, else home.
 * @param {string | null | undefined} next
 * @returns {{ href: string, label: string }}
 */
export function authExitTarget(next) {
  const match = typeof next === "string" ? next.trim().match(EVENT_PATH) : null;
  if (match) return { href: `/marketplace/eventDetails/${match[1]}`, label: "Back to event" };
  return { href: "/", label: "Back to home" };
}

/**
 * Sign-in URL for a known role, skipping the role selector.
 * Unknown role falls back to the role selector.
 * @param {string | null | undefined} next
 * @param {string | null | undefined} [role]
 * @returns {string}
 */
export function signInHref(next, role) {
  if (role === "attendee") return `/sign-in/phone${authSearchParams({ next, role })}`;
  if (role === "organizer") return `/sign-in/email${authSearchParams({ next, role })}`;
  return `/sign-in${authSearchParams({ next })}`;
}

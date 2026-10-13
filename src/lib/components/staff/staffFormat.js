/** Door staff (roadmap 7.3) display and input helpers. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "+232 •• ••• 456" from "+23276123456". Anything else is returned as is.
 * @param {string | null | undefined} phone
 */
export function maskStaffPhone(phone) {
  const value = String(phone || "");
  if (!/^\+232\d{8}$/.test(value)) return value;
  return `+232 •• ••• ${value.slice(-3)}`;
}

/**
 * "Oct 2, 2026" in Freetown time.
 * @param {string | null | undefined} iso
 */
export function formatAddedDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Freetown",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Same rule as the server: "@" means an email, anything else must be a
 * Sierra Leone number with 8 digits after +232 (a leading 0 is allowed).
 * @param {string | null | undefined} value
 */
export function checkStaffContact(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (raw.includes("@")) return EMAIL_RE.test(raw);

  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("232")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{8}$/.test(digits);
}

/**
 * Staff contact as shown on cards: email, or masked phone.
 * @param {{ type: string, contact: string }} staff
 */
export function staffContactLabel(staff) {
  return staff.type === "phone" ? maskStaffPhone(staff.contact) : staff.contact;
}

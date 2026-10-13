/**
 * Door-staff login helpers (roadmap 7.3 / FR-42).
 * Each door_staff row signs in with a synthetic Auth email on this domain.
 * Session type "staff" is detected from this domain only, never user_metadata.
 */
export const STAFF_SYNTHETIC_DOMAIN = "staff.sosseats.internal";

export function staffAuthEmail(staffId: string): string {
  return `staff-${staffId}@${STAFF_SYNTHETIC_DOMAIN}`;
}

export function isStaffSyntheticEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  return email.trim().toLowerCase().endsWith(`@${STAFF_SYNTHETIC_DOMAIN}`);
}

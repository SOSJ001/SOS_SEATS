/**
 * Values used by the Terms of Service and Privacy Policy.
 * Anything in [brackets] must be filled in before the site is shared.
 * Only promise what you actually do: change a number here if it isn't realistic.
 */
export const LEGAL = {
  operatorName: "Michael Johnson",
  contactEmail: "sosj001@duck.com",
  effectiveDate: "13 October 2026",
  governingLaw: "Sierra Leone",
  hostingRegion: "West US (North California)",
  hostingProvider: "Netlify",
  minAge: 18,
  requestResponseDays: 30,
  orderRecordsMonths: 24,
  pilotDataDeletionDays: 90,
  payoutWindowDays: 14,
};

/** Placeholder values that still need filling in (empty when ready to share). */
export function unfilledLegalKeys() {
  return Object.entries(LEGAL)
    .filter(([, value]) => typeof value === "string" && value.startsWith("["))
    .map(([key]) => key);
}

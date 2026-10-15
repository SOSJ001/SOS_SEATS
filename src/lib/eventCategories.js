/** One category per event; shared by create/edit, Settings, marketplace chips and home. */
export const DEFAULT_CATEGORY = "Other";

export const EVENT_CATEGORIES = [
  "Music & Concerts",
  "Nightlife & Parties",
  "Comedy",
  "Arts & Culture",
  "Film & Theatre",
  "Festivals",
  "Sports & Fitness",
  "Tech",
  "Business & Networking",
  "Workshops & Education",
  "Food & Drink",
  "Fashion & Beauty",
  "Faith & Church",
  "Community & Charity",
  "Family & Kids",
  DEFAULT_CATEGORY,
];

export const FEATURED_CATEGORIES = [
  "Music & Concerts",
  "Nightlife & Parties",
  "Comedy",
  "Tech",
  "Sports & Fitness",
  "Food & Drink",
];

/** @param {unknown} value */
export function isEventCategory(value) {
  return typeof value === "string" && EVENT_CATEGORIES.includes(value);
}

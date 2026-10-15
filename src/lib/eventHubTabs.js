import { isPrivateEvent } from "$lib/eventVisibility";

export const EVENT_HUB_TABS = [
  { id: "overview", label: "Overview" },
  { id: "guests", label: "Guests" },
  { id: "generate", label: "Generate" },
  { id: "settings", label: "Settings" },
];

/**
 * Tabs this event can show. Generate (private ticket issuing) is private events only.
 * @param {{ event_visibility?: string | null } | null | undefined} event
 */
export function hubTabsFor(event) {
  return isPrivateEvent(event)
    ? EVENT_HUB_TABS
    : EVENT_HUB_TABS.filter((t) => t.id !== "generate");
}

/**
 * @param {string | null | undefined} value
 * @param {{ event_visibility?: string | null } | null | undefined} [event]
 */
export function normalizeHubTab(value, event) {
  const ids = hubTabsFor(event).map((t) => t.id);
  return value && ids.includes(value) ? value : "overview";
}

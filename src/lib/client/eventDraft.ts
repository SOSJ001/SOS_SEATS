/**
 * Client-only draft helpers for the create-event wizard (roadmap 4.1).
 * Do not import from server modules.
 */

export const EVENT_DRAFT_KEY = "eventCreationData";

export type EventDraft = Record<string, unknown>;

export function loadEventDraft(defaults: EventDraft = {}): EventDraft {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(EVENT_DRAFT_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as EventDraft;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function saveEventDraft(data: EventDraft): void {
  if (typeof localStorage === "undefined") return;
  const toSave = { ...data };
  delete toSave.image;
  localStorage.setItem(EVENT_DRAFT_KEY, JSON.stringify(toSave));
}

export function clearEventDraft(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(EVENT_DRAFT_KEY);
}

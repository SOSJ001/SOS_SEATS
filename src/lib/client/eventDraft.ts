/**
 * Client-only draft helpers for the create and edit event wizards (roadmap 4.1).
 * Do not import from server modules.
 */

export const EVENT_DRAFT_KEY = "eventCreationData";

export type EventDraft = Record<string, unknown>;

export function editDraftKey(eventId: string): string {
  return `eventEditDraft:${eventId}`;
}

export function loadEventDraft(
  defaults: EventDraft = {},
  key: string = EVENT_DRAFT_KEY
): EventDraft {
  if (typeof localStorage === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as EventDraft;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

/**
 * Returns false when the draft could only be kept without its cover image
 * (or not at all), e.g. when localStorage is full.
 */
export function saveEventDraft(
  data: EventDraft,
  key: string = EVENT_DRAFT_KEY
): boolean {
  if (typeof localStorage === "undefined") return true;
  const toSave = { ...data };
  delete toSave.image;
  try {
    localStorage.setItem(key, JSON.stringify(toSave));
    return true;
  } catch {
    delete toSave.imagePreview;
    try {
      localStorage.setItem(key, JSON.stringify(toSave));
    } catch {
      /* storage unavailable */
    }
    return false;
  }
}

export function clearEventDraft(key: string = EVENT_DRAFT_KEY): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key);
}

type EditableEvent = {
  id: string;
  updated_at?: string | null;
  name?: string | null;
  organizer?: string | null;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  is_free_event?: boolean | null;
  audience_type?: string | null;
  event_visibility?: string | null;
  status?: string | null;
  ticket_design_config?: unknown;
  ticket_types?: Array<{
    id: string;
    name: string;
    description?: string | null;
    price?: number | string | null;
    quantity?: number | null;
    sold_quantity?: number | null;
  }>;
};

export function draftFromEvent(event: EditableEvent): EventDraft {
  return {
    name: event.name || "",
    organizer: event.organizer || "",
    description: event.description || "",
    date: event.date || "",
    time: String(event.time || "").slice(0, 5),
    location: event.location || "",
    imagePreview: event.imageUrl || null,
    is_free_event: !!event.is_free_event,
    audience_type: event.audience_type || "all-ages",
    event_visibility: event.event_visibility || "public",
    status: event.status || "draft",
    ticket_design_config: event.ticket_design_config || null,
    ticket_types: (event.ticket_types || []).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      price: Number(t.price) || 0,
      quantity: t.quantity ?? null,
      sold_quantity: t.sold_quantity || 0,
    })),
    _updated_at: event.updated_at || null,
    _dirty: false,
  };
}

/**
 * Seeds the edit draft from the server copy when there is none, or when the
 * event changed since the draft was made. Returns true when unsaved edits
 * were thrown away.
 */
export function syncEditDraft(event: EditableEvent): boolean {
  const key = editDraftKey(event.id);
  const existing = loadEventDraft({}, key);
  const hasDraft = Object.keys(existing).length > 0;
  if (hasDraft && existing._updated_at === (event.updated_at || null)) {
    return false;
  }
  saveEventDraft(draftFromEvent(event), key);
  return hasDraft && existing._dirty === true;
}

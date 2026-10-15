/**
 * Event input validation and normalisers shared by createEventApi,
 * updateEventApi and the hub Settings action.
 */
import { DEFAULT_CATEGORY, isEventCategory } from "$lib/eventCategories";
import { EVENT_LIMITS } from "$lib/eventLimits";
import { PRIVATE_INVITE_TYPE_NAME } from "$lib/server/payments/privateIssue";

type Ok<T> = { ok: true; value: T };
type Err = { ok: false; error: string };
type Result<T> = Ok<T> | Err;

const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
const err = (error: string): Err => ({ ok: false, error });

const AUDIENCE_TYPES = ["all-ages", "18-plus", "21-plus"];
const VISIBILITIES = ["public", "private"];
const STATUSES = ["draft", "published"];
const SOCIAL_KEYS = ["facebook", "twitter", "instagram"] as const;

export type SocialMedia = Record<(typeof SOCIAL_KEYS)[number], string>;

export type TicketTypeInput = {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
};

export function isPrivateInviteName(name: unknown): boolean {
  return (
    String(name || "").trim().toLowerCase() ===
    PRIVATE_INVITE_TYPE_NAME.toLowerCase()
  );
}

/**
 * Capacity = active types' quantity + sold count of retired (inactive) types.
 * Private Invite is issued separately and never counts.
 */
export function ticketCapacity(
  types: Array<{
    name?: string | null;
    quantity?: number | null;
    sold_quantity?: number | null;
    is_active?: boolean | null;
  }> | null | undefined
): number {
  return (types || []).reduce((sum, t) => {
    if (isPrivateInviteName(t?.name)) return sum;
    const value =
      t?.is_active === false ? Number(t?.sold_quantity) : Number(t?.quantity);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function normalizeCategory(value: unknown): Result<string> {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return ok(DEFAULT_CATEGORY);
  if (!isEventCategory(v)) return err("Pick a category from the list");
  return ok(v);
}

export function normalizeTags(value: unknown): Result<string[]> {
  if (value === undefined || value === null || value === "") return ok([]);
  if (!Array.isArray(value)) return err("Tags must be a list");
  const out: string[] = [];
  for (const raw of value) {
    const tag = String(raw ?? "")
      .replace(/^#+/, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
    if (!tag) continue;
    if (tag.length > EVENT_LIMITS.tagLength) {
      return err(`Tags can be at most ${EVENT_LIMITS.tagLength} characters`);
    }
    if (!out.includes(tag)) out.push(tag);
  }
  if (out.length > EVENT_LIMITS.tagsMax) {
    return err(`Add at most ${EVENT_LIMITS.tagsMax} tags`);
  }
  return ok(out);
}

/** Empty -> "". Adds https:// when no scheme; only http(s) is allowed. */
export function normalizeUrl(value: unknown, label: string): Result<string> {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return ok("");
  if (v.length > EVENT_LIMITS.url) {
    return err(`${label} can be at most ${EVENT_LIMITS.url} characters`);
  }
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(v);
  if (hasScheme && !/^https?:\/\//i.test(v)) {
    return err(`${label} must be an http or https link`);
  }
  let url: URL;
  try {
    url = new URL(hasScheme ? v : `https://${v}`);
  } catch {
    return err(`${label} is not a valid link`);
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
    return err(`${label} is not a valid link`);
  }
  const href = url.href;
  if (href.length > EVENT_LIMITS.url) {
    return err(`${label} can be at most ${EVENT_LIMITS.url} characters`);
  }
  return ok(href);
}

export function normalizeSocialMedia(value: unknown): Result<SocialMedia> {
  const src =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const labels: Record<string, string> = {
    facebook: "Facebook link",
    twitter: "Twitter/X link",
    instagram: "Instagram link",
  };
  const out = { facebook: "", twitter: "", instagram: "" } as SocialMedia;
  for (const key of SOCIAL_KEYS) {
    const res = normalizeUrl(src[key], labels[key]);
    if (!res.ok) return res;
    out[key] = res.value;
  }
  return ok(out);
}

/** Empty -> null. */
export function normalizeEmail(value: unknown): Result<string | null> {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return ok(null);
  if (v.length > EVENT_LIMITS.email) {
    return err(`Contact email can be at most ${EVENT_LIMITS.email} characters`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return err("Enter a valid contact email");
  }
  return ok(v);
}

function text(
  value: unknown,
  label: string,
  max: number,
  required: boolean
): Result<string> {
  if (value !== undefined && value !== null && typeof value !== "string") {
    return err(`${label} must be text`);
  }
  const v = String(value ?? "").trim();
  if (required && !v) return err(`${label} is required`);
  if (v.length > max) return err(`${label} can be at most ${max} characters`);
  return ok(v);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string): boolean {
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return false;
  return Number(m[1]) < 24 && Number(m[2]) < 60 && Number(m[3] || 0) < 60;
}

export function validateTicketTypes(
  value: unknown,
  isFree: boolean
): Result<TicketTypeInput[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return err("Add at least one ticket type");
  }
  const seen = new Set<string>();
  const out: TicketTypeInput[] = [];
  for (const raw of value) {
    const t = raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
    const name = text(t.name, "Ticket name", EVENT_LIMITS.ticketName, true);
    if (!name.ok) return name;
    if (isPrivateInviteName(name.value)) {
      return err(`"${PRIVATE_INVITE_TYPE_NAME}" is reserved, pick another ticket name`);
    }
    const key = name.value.toLowerCase();
    if (seen.has(key)) return err(`Ticket names must be unique: ${name.value}`);
    seen.add(key);

    const description = text(
      t.description,
      `${name.value} description`,
      EVENT_LIMITS.ticketDescription,
      false
    );
    if (!description.ok) return description;

    let price = 0;
    if (!isFree) {
      price = Math.round(Number(t.price) * 100) / 100;
      if (!Number.isFinite(price) || price <= 0) {
        return err(`${name.value}: price must be greater than 0`);
      }
      if (price > EVENT_LIMITS.ticketPriceMax) {
        return err(`${name.value}: price can be at most ${EVENT_LIMITS.ticketPriceMax} NLe`);
      }
    }

    const quantity = Number(t.quantity);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > EVENT_LIMITS.ticketQuantityMax
    ) {
      return err(
        `${name.value}: quantity must be a whole number from 1 to ${EVENT_LIMITS.ticketQuantityMax}`
      );
    }

    out.push({
      ...(t.id ? { id: String(t.id) } : {}),
      name: name.value,
      description: description.value || null,
      price,
      quantity,
    });
  }
  return ok(out);
}

export type ValidatedEventInput = {
  payload: Record<string, any>;
  ticketTypes?: TicketTypeInput[];
};

/**
 * Validate an event body. In "create" mode the core fields are required;
 * in "update" mode only keys present in the body are validated and returned.
 * `currentIsFree` is the stored is_free_event, used to price tickets when the
 * body does not send is_free_event.
 */
export function validateEventInput(
  body: unknown,
  mode: "create" | "update",
  currentIsFree = false
): Result<ValidatedEventInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return err("Invalid request body");
  }
  const b = body as Record<string, any>;
  const has = (k: string) => mode === "create" || b[k] !== undefined;
  const payload: Record<string, any> = {};

  const textFields: Array<[string, string, number, boolean]> = [
    ["name", "Event name", EVENT_LIMITS.name, true],
    ["location", "Venue location", EVENT_LIMITS.location, true],
    ["organizer", "Organizer", EVENT_LIMITS.organizer, false],
    ["description", "Description", EVENT_LIMITS.description, false],
  ];
  for (const [key, label, max, required] of textFields) {
    if (!has(key)) continue;
    const res = text(b[key], label, max, required);
    if (!res.ok) return res;
    payload[key] = res.value;
  }

  if (has("date")) {
    const v = String(b.date ?? "").trim();
    if (!v) return err("Event date is required");
    if (!isValidDate(v)) return err("Event date must be YYYY-MM-DD");
    payload.date = v;
  }
  if (has("time")) {
    const v = String(b.time ?? "").trim();
    if (!v) return err("Event time is required");
    if (!isValidTime(v)) return err("Event time must be HH:MM");
    payload.time = v;
  }

  if (has("is_free_event")) {
    const v = b.is_free_event ?? false;
    if (typeof v !== "boolean") return err("is_free_event must be true or false");
    payload.is_free_event = v;
  }

  if (has("audience_type")) {
    const v = b.audience_type ?? "all-ages";
    if (!AUDIENCE_TYPES.includes(v)) return err("Invalid audience type");
    payload.audience_type = v;
  }
  if (has("event_visibility")) {
    const v = b.event_visibility ?? "public";
    if (!VISIBILITIES.includes(v)) return err("Invalid visibility");
    payload.event_visibility = v;
  }
  if (has("status")) {
    const v = b.status ?? "draft";
    if (!STATUSES.includes(v)) return err("Invalid status");
    payload.status = v;
  }

  if (has("ticket_design_config")) {
    const v = b.ticket_design_config ?? null;
    if (v !== null) {
      if (typeof v !== "object" || Array.isArray(v)) {
        return err("Invalid ticket design");
      }
      if (JSON.stringify(v).length > EVENT_LIMITS.designConfigBytes) {
        return err("Ticket design is too large");
      }
    }
    payload.ticket_design_config = v;
  }

  if (has("category")) {
    const res = normalizeCategory(b.category);
    if (!res.ok) return res;
    payload.category = res.value;
  }
  if (has("tags")) {
    const res = normalizeTags(b.tags);
    if (!res.ok) return res;
    payload.tags = res.value;
  }
  if (has("website")) {
    const res = normalizeUrl(b.website, "Website");
    if (!res.ok) return res;
    payload.website = res.value || null;
  }
  if (has("social_media")) {
    const res = normalizeSocialMedia(b.social_media);
    if (!res.ok) return res;
    payload.social_media = res.value;
  }
  if (has("contact_email")) {
    const res = normalizeEmail(b.contact_email);
    if (!res.ok) return res;
    payload.contact_email = res.value;
  }

  let ticketTypes: TicketTypeInput[] | undefined;
  if (has("ticket_types")) {
    const isFree =
      payload.is_free_event !== undefined ? payload.is_free_event : currentIsFree;
    const res = validateTicketTypes(b.ticket_types, isFree);
    if (!res.ok) return res;
    ticketTypes = res.value;
  }

  return ok({ payload, ticketTypes });
}

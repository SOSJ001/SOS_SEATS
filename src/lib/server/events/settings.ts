/**
 * Event hub Settings tab: category, tags, links, contact email and the
 * per-type order limit. Do not import from client components.
 */
import { getServerSupabase } from "$lib/server/db";
import { EVENT_LIMITS } from "$lib/eventLimits";
import {
  normalizeCategory,
  normalizeEmail,
  normalizeSocialMedia,
  normalizeTags,
  normalizeUrl,
} from "./validate";

export const DEFAULT_MAX_PER_ORDER = 1;

/** Max tickets per type, per order. Service role, so private and draft events work too. */
export async function getMaxPerOrder(eventId: string): Promise<number> {
  const { data, error } = await getServerSupabase()
    .from("seating_options")
    .select("max_seats_per_order")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getMaxPerOrder failed", error);
    return DEFAULT_MAX_PER_ORDER;
  }
  const n = Number(data?.max_seats_per_order);
  return Number.isInteger(n) && n >= 1 ? n : DEFAULT_MAX_PER_ORDER;
}

export type EventSettingsInput = {
  category?: unknown;
  tags?: unknown;
  website?: unknown;
  social_media?: unknown;
  contact_email?: unknown;
  maxPerOrder?: unknown;
};

export type EventSettingsResult =
  | { success: true }
  | { success: false; error: string; validation: boolean };

const SAVE_FAILED = "Could not save settings";

export async function updateEventSettings(
  eventId: string,
  userId: string,
  input: EventSettingsInput
): Promise<EventSettingsResult> {
  const invalid = (error: string): EventSettingsResult => ({
    success: false,
    error,
    validation: true,
  });

  const category = normalizeCategory(input.category);
  if (!category.ok) return invalid(category.error);
  const tags = normalizeTags(input.tags);
  if (!tags.ok) return invalid(tags.error);
  const website = normalizeUrl(input.website, "Website");
  if (!website.ok) return invalid(website.error);
  const social = normalizeSocialMedia(input.social_media);
  if (!social.ok) return invalid(social.error);
  const email = normalizeEmail(input.contact_email);
  if (!email.ok) return invalid(email.error);

  const maxPerOrder = Number(input.maxPerOrder);
  if (
    !Number.isInteger(maxPerOrder) ||
    maxPerOrder < 1 ||
    maxPerOrder > EVENT_LIMITS.maxPerOrderMax
  ) {
    return invalid(
      `Max tickets per type must be a whole number from 1 to ${EVENT_LIMITS.maxPerOrderMax}`
    );
  }

  const db = getServerSupabase();
  const { data: updated, error: updateError } = await db
    .from("events")
    .update({
      category: category.value,
      tags: tags.value,
      website: website.value || null,
      social_media: social.value,
      contact_email: email.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (updateError) {
    console.error("updateEventSettings: event update failed", updateError);
    return { success: false, error: SAVE_FAILED, validation: false };
  }
  if (!updated) {
    return { success: false, error: "Event not found or unauthorized", validation: true };
  }

  const { data: existing, error: loadError } = await db
    .from("seating_options")
    .select("id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (loadError) {
    console.error("updateEventSettings: seating_options load failed", loadError);
    return { success: false, error: SAVE_FAILED, validation: false };
  }

  const { error: seatingError } = existing
    ? await db
        .from("seating_options")
        .update({ max_seats_per_order: maxPerOrder, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await db
        .from("seating_options")
        .insert({ event_id: eventId, max_seats_per_order: maxPerOrder });
  if (seatingError) {
    console.error("updateEventSettings: seating_options save failed", seatingError);
    return { success: false, error: SAVE_FAILED, validation: false };
  }

  return { success: true };
}

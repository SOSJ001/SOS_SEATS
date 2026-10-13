/**
 * Door staff (roadmap 7.3 / FR-42, FR-43). Service-role only.
 * Organiser side: invite by email or phone with an organiser-set password,
 * assign events, unassign, revoke and set a new password.
 * Staff side: sign-in lookup, scan access and the assigned event list.
 */
import { randomUUID } from "node:crypto";
import { getServerSupabase } from "$lib/server/db";
import {
  normalizeSlPhone,
  staffAuthEmail,
  isStaffSyntheticEmail,
  isPhoneSyntheticEmail,
} from "$lib/server/auth";
import { assertEventOwnedByUser } from "$lib/server/events";
import {
  doorToday,
  phaseFor,
  loadDoorEventsByIds,
  type DoorEvent,
  type DoorEventPhase,
  type DoorEventsSummary,
} from "$lib/server/tickets/door";

export const STAFF_PASSWORD_MIN = 8;

/** Auth ban for revoked or replaced staff logins (about 100 years). */
const STAFF_BAN_DURATION = "876000h";

const CONTACT_IN_USE = "This contact can't be added as door staff right now.";
const GENERIC_ERROR = "Something went wrong. Try again.";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StaffField = "contact" | "password" | "events";

export type StaffFail = {
  ok: false;
  status: number;
  error: string;
  field?: StaffField;
};

export type StaffResult<T> = ({ ok: true } & T) | StaffFail;

export type StaffContact =
  | { type: "email"; email: string; display: string }
  | { type: "phone"; phone: string; display: string };

export type StaffEvent = {
  id: string;
  name: string;
  date: string | null;
  phase: DoorEventPhase;
};

export type StaffMember = {
  id: string;
  type: "email" | "phone";
  contact: string;
  createdAt: string;
  events: StaffEvent[];
};

/** The signed-in staff member's own login contact. */
export type StaffSelf = {
  id: string;
  type: "email" | "phone";
  contact: string;
};

function fail(status: number, error: string, field?: StaffField): StaffFail {
  return field ? { ok: false, status, error, field } : { ok: false, status, error };
}

function serverFail(where: string, err: unknown): StaffFail {
  console.error(`door staff ${where}:`, err instanceof Error ? err.message : err);
  return fail(500, GENERIC_ERROR);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function checkPassword(password: unknown): StaffFail | null {
  if (typeof password !== "string" || password.length < STAFF_PASSWORD_MIN) {
    return fail(
      400,
      `Password must be at least ${STAFF_PASSWORD_MIN} characters`,
      "password"
    );
  }
  return null;
}

function cleanEventIds(eventIds: unknown): string[] | StaffFail {
  const list = Array.isArray(eventIds) ? eventIds : [];
  if (list.length === 0 || !list.every(isUuid)) {
    return fail(400, "Select at least one event", "events");
  }
  return [...new Set(list.map((id) => id.toLowerCase()))];
}

/** "@" means email; anything else must be a Sierra Leone phone number. */
export function normalizeStaffContact(value: unknown): StaffResult<{ contact: StaffContact }> {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fail(400, "Enter an email or phone number", "contact");

  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    if (
      !EMAIL_RE.test(email) ||
      isStaffSyntheticEmail(email) ||
      isPhoneSyntheticEmail(email)
    ) {
      return fail(400, "Enter a valid email address", "contact");
    }
    return { ok: true, contact: { type: "email", email, display: email } };
  }

  const phone = normalizeSlPhone(raw);
  if (!phone.ok) return fail(400, phone.error, "contact");
  return { ok: true, contact: { type: "phone", phone: phone.e164, display: phone.e164 } };
}

/** Published events from today on: the only events staff can be assigned. */
export async function loadStaffEligibleEvents(organizerId: string): Promise<StaffEvent[]> {
  const db = getServerSupabase();
  const today = doorToday();
  const { data, error } = await db
    .from("events")
    .select("id, name, date")
    .eq("user_id", organizerId)
    .eq("status", "published")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((e: any) => ({
    id: e.id,
    name: e.name || "Untitled event",
    date: e.date || null,
    phase: phaseFor(e.date, today),
  }));
}

async function pickEligible(
  organizerId: string,
  ids: string[]
): Promise<StaffEvent[] | StaffFail> {
  const eligible = await loadStaffEligibleEvents(organizerId);
  const byId = new Map(eligible.map((e) => [e.id, e]));
  const picked = ids.map((id) => byId.get(id));
  if (picked.some((e) => !e)) {
    return fail(400, "Choose from your upcoming published events", "events");
  }
  return picked as StaffEvent[];
}

async function findActiveByContact(contact: StaffContact) {
  const db = getServerSupabase();
  let query = db
    .from("door_staff")
    .select("id, organizer_user_id")
    .is("revoked_at", null);
  query =
    contact.type === "email"
      ? query.eq("login_email", contact.email)
      : query.eq("login_phone", contact.phone);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data as { id: string; organizer_user_id: string } | null;
}

async function findOwnedStaff(organizerId: string, staffId: unknown) {
  if (!isUuid(staffId)) return null;
  const db = getServerSupabase();
  const { data, error } = await db
    .from("door_staff")
    .select("id, auth_user_id")
    .eq("id", staffId)
    .eq("organizer_user_id", organizerId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as { id: string; auth_user_id: string } | null;
}

/** Inserts assignments, skipping ones that already exist. Returns how many were new. */
async function addAssignments(staffId: string, eventIds: string[]): Promise<number> {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("door_staff_events")
    .upsert(
      eventIds.map((event_id) => ({ staff_id: staffId, event_id })),
      { onConflict: "staff_id,event_id", ignoreDuplicates: true }
    )
    .select("event_id");
  if (error) throw new Error(error.message);
  return (data || []).length;
}

async function banAuthUser(authUserId: string) {
  const db = getServerSupabase();
  const { error } = await db.auth.admin.updateUserById(authUserId, {
    ban_duration: STAFF_BAN_DURATION,
  });
  if (error) console.error("door staff ban failed:", error.message);
}

export async function inviteStaff(input: {
  organizerId: string;
  contact: unknown;
  password: unknown;
  eventIds: unknown;
}): Promise<
  StaffResult<{
    staffId: string;
    alreadyStaff: boolean;
    added: number;
    contact: string;
    events: StaffEvent[];
  }>
> {
  const { organizerId } = input;

  const norm = normalizeStaffContact(input.contact);
  if (!norm.ok) return norm;
  const { contact } = norm;

  const badPassword = checkPassword(input.password);
  if (badPassword) return badPassword;
  const password = input.password as string;

  const ids = cleanEventIds(input.eventIds);
  if (!Array.isArray(ids)) return ids;

  try {
    const events = await pickEligible(organizerId, ids);
    if (!Array.isArray(events)) return events;

    const addToExisting = async (staffId: string) => ({
      ok: true as const,
      staffId,
      alreadyStaff: true,
      added: await addAssignments(staffId, ids),
      contact: contact.display,
      events,
    });

    const existing = await findActiveByContact(contact);
    if (existing?.organizer_user_id === organizerId) {
      return addToExisting(existing.id);
    }

    const db = getServerSupabase();
    const staffId = randomUUID();
    const { data: created, error: createErr } = await db.auth.admin.createUser({
      email: staffAuthEmail(staffId),
      password,
      email_confirm: true,
      user_metadata: { name: contact.display },
    });
    if (createErr || !created.user) {
      return serverFail("create login", createErr?.message);
    }
    const authUserId = created.user.id;

    const { data: replaced, error: rpcErr } = await db.rpc("create_door_staff", {
      p_staff_id: staffId,
      p_organizer: organizerId,
      p_auth_user: authUserId,
      p_login_type: contact.type,
      p_login_email: contact.type === "email" ? contact.email : null,
      p_login_phone: contact.type === "phone" ? contact.phone : null,
      p_event_ids: ids,
      p_today: doorToday(),
    });

    if (rpcErr) {
      const { error: deleteErr } = await db.auth.admin.deleteUser(authUserId);
      if (deleteErr) console.error("door staff cleanup failed:", deleteErr.message);

      if (rpcErr.message.includes("already_staff")) {
        const again = await findActiveByContact(contact);
        if (again?.organizer_user_id === organizerId) return addToExisting(again.id);
      }
      if (rpcErr.message.includes("contact_in_use") || rpcErr.code === "23505") {
        return fail(409, CONTACT_IN_USE);
      }
      return serverFail("create_door_staff", rpcErr.message);
    }

    if (typeof replaced === "string" && replaced) {
      await banAuthUser(replaced);
    }

    return {
      ok: true,
      staffId,
      alreadyStaff: false,
      added: ids.length,
      contact: contact.display,
      events,
    };
  } catch (err) {
    return serverFail("invite", err);
  }
}

export async function listOrganizerStaff(organizerId: string): Promise<StaffMember[]> {
  const db = getServerSupabase();
  const today = doorToday();
  const { data, error } = await db
    .from("door_staff")
    .select(
      "id, login_type, login_email, login_phone, created_at, door_staff_events(event_id, events(id, name, date))"
    )
    .eq("organizer_user_id", organizerId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => {
    const events: StaffEvent[] = (row.door_staff_events || [])
      .map((a: any) => a.events)
      .filter(Boolean)
      .map((e: any) => ({
        id: e.id,
        name: e.name || "Untitled event",
        date: e.date || null,
        phase: phaseFor(e.date, today),
      }))
      .sort((a: StaffEvent, b: StaffEvent) =>
        String(a.date || "").localeCompare(String(b.date || ""))
      );
    return {
      id: row.id,
      type: row.login_type,
      contact: row.login_type === "email" ? row.login_email : row.login_phone,
      createdAt: row.created_at,
      events,
    };
  });
}

export async function assignEvents(
  organizerId: string,
  staffId: unknown,
  eventIds: unknown
): Promise<StaffResult<{ added: number }>> {
  const ids = cleanEventIds(eventIds);
  if (!Array.isArray(ids)) return ids;

  try {
    const staff = await findOwnedStaff(organizerId, staffId);
    if (!staff) return fail(404, "Staff member not found");

    const events = await pickEligible(organizerId, ids);
    if (!Array.isArray(events)) return events;

    return { ok: true, added: await addAssignments(staff.id, ids) };
  } catch (err) {
    return serverFail("assign", err);
  }
}

export async function unassignEvent(
  organizerId: string,
  staffId: unknown,
  eventId: unknown
): Promise<StaffResult<{}>> {
  if (!isUuid(eventId)) return fail(404, "Assignment not found");

  try {
    const staff = await findOwnedStaff(organizerId, staffId);
    if (!staff) return fail(404, "Staff member not found");

    const db = getServerSupabase();
    const { error } = await db
      .from("door_staff_events")
      .delete()
      .eq("staff_id", staff.id)
      .eq("event_id", eventId);
    if (error) return serverFail("unassign", error.message);
    return { ok: true };
  } catch (err) {
    return serverFail("unassign", err);
  }
}

/** Permanent: the row keeps revoked_at and the Auth login is banned. */
export async function revokeStaff(
  organizerId: string,
  staffId: unknown
): Promise<StaffResult<{}>> {
  try {
    const staff = await findOwnedStaff(organizerId, staffId);
    if (!staff) return fail(404, "Staff member not found");

    const db = getServerSupabase();
    const { error } = await db
      .from("door_staff")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", staff.id)
      .is("revoked_at", null);
    if (error) return serverFail("revoke", error.message);

    await banAuthUser(staff.auth_user_id);
    return { ok: true };
  } catch (err) {
    return serverFail("revoke", err);
  }
}

export async function setStaffPassword(
  organizerId: string,
  staffId: unknown,
  password: unknown
): Promise<StaffResult<{}>> {
  const badPassword = checkPassword(password);
  if (badPassword) return badPassword;

  try {
    const staff = await findOwnedStaff(organizerId, staffId);
    if (!staff) return fail(404, "Staff member not found");

    const db = getServerSupabase();
    const { error } = await db.auth.admin.updateUserById(staff.auth_user_id, {
      password: password as string,
    });
    if (error) return serverFail("set password", error.message);
    return { ok: true };
  } catch (err) {
    return serverFail("set password", err);
  }
}

/**
 * Staff sign-in: the synthetic Auth email of the active (not revoked) login for
 * this email or phone, or null. DB errors throw.
 */
export async function findActiveStaffLogin(identifier: unknown): Promise<string | null> {
  const norm = normalizeStaffContact(identifier);
  if (!norm.ok) return null;
  const row = await findActiveByContact(norm.contact);
  return row ? staffAuthEmail(row.id) : null;
}

export async function findActiveStaffByAuthUser(userId: string): Promise<StaffSelf | null> {
  if (!userId) return null;
  const db = getServerSupabase();
  const { data, error } = await db
    .from("door_staff")
    .select("id, login_type, login_email, login_phone")
    .eq("auth_user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    type: data.login_type,
    contact: data.login_type === "email" ? data.login_email : data.login_phone,
  };
}

/**
 * Staff: an active login assigned to this published event.
 * Everyone else: the event owner.
 */
export async function canScanEvent(
  eventId: string,
  userId: string,
  sessionType: string | null | undefined
): Promise<boolean> {
  if (!userId || !isUuid(eventId)) return false;
  if (sessionType !== "staff") return assertEventOwnedByUser(eventId, userId);

  const staff = await findActiveStaffByAuthUser(userId);
  if (!staff) return false;

  const db = getServerSupabase();
  const { data, error } = await db
    .from("door_staff_events")
    .select("event_id, events!inner(status)")
    .eq("staff_id", staff.id)
    .eq("event_id", eventId)
    .eq("events.status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

/** The staff member's assigned published events, or null without an active login. */
export async function loadStaffDoorEvents(userId: string): Promise<{
  staffContact: StaffSelf;
  events: DoorEvent[];
  summary: DoorEventsSummary;
} | null> {
  const staff = await findActiveStaffByAuthUser(userId);
  if (!staff) return null;

  const db = getServerSupabase();
  const { data, error } = await db
    .from("door_staff_events")
    .select("event_id")
    .eq("staff_id", staff.id);
  if (error) throw new Error(error.message);

  const ids = (data || []).map((row: any) => String(row.event_id));
  const { events, summary } = await loadDoorEventsByIds(ids);
  return { staffContact: staff, events, summary };
}

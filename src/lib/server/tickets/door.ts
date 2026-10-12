/**
 * Door events + scanner data (roadmap 7.2).
 * Organiser scope: events they own. 7.3 adds door staff and their assigned events.
 * Counts use exact head queries, never downloaded rows (API row cap).
 */
import { getServerSupabase } from "$lib/server/db";
import { loadScanHistoryServer, resolveImageUrl } from "$lib/server/tickets";

export const DOOR_TIME_ZONE = "Africa/Freetown";

/** Guests that hold an admissible ticket (pending = unpaid, not counted). */
const TICKETED_STATUSES = ["confirmed", "issued", "checked-in"];

export type DoorEventPhase = "active" | "upcoming" | "past";

export type DoorEvent = {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  imageUrl: string | null;
  phase: DoorEventPhase;
  checkedIn: number;
  total: number;
};

export type DoorEventsSummary = {
  activeEvents: number;
  scannedToday: number;
  notCheckedIn: number;
};

export type EventScanStats = {
  checkedIn: number;
  total: number;
  rate: number;
  lastScanAt: string | null;
};

export type RecentScan = {
  id: string;
  guestName: string;
  ticketType: string;
  checkInTime: string;
};

/** YYYY-MM-DD for "today" at the door. */
export function doorToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DOOR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function phaseFor(date: string | null, today: string): DoorEventPhase {
  if (!date) return "upcoming";
  const day = String(date).slice(0, 10);
  if (day === today) return "active";
  return day > today ? "upcoming" : "past";
}

async function countGuests(
  eventIds: string | string[],
  filter: "ticketed" | "checkedIn"
): Promise<number> {
  const db = getServerSupabase();
  let query = db.from("guests").select("id", { count: "exact", head: true });
  query = Array.isArray(eventIds)
    ? query.in("event_id", eventIds)
    : query.eq("event_id", eventIds);
  query =
    filter === "ticketed"
      ? query.in("status", TICKETED_STATUSES)
      : query.eq("status", "checked-in");
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function loadDoorEvents(
  userId: string
): Promise<{ events: DoorEvent[]; summary: DoorEventsSummary }> {
  const db = getServerSupabase();
  const { data: rows, error } = await db
    .from("events")
    .select("id, name, date, time, location, image_id")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  const list = rows || [];
  if (list.length === 0) {
    return {
      events: [],
      summary: { activeEvents: 0, scannedToday: 0, notCheckedIn: 0 },
    };
  }

  const today = doorToday();
  const eventIds = list.map((e: any) => e.id);
  const imageIds = [...new Set(list.map((e: any) => e.image_id).filter(Boolean))];

  // Freetown is UTC+0 all year, so its calendar day is the UTC day.
  const dayStart = `${today}T00:00:00Z`;

  const [counts, imageRows, scannedTodayRes] = await Promise.all([
    Promise.all(
      list.map(async (e: any) => {
        const [total, checkedIn] = await Promise.all([
          countGuests(e.id, "ticketed"),
          countGuests(e.id, "checkedIn"),
        ]);
        return { total, checkedIn };
      })
    ),
    imageIds.length
      ? db.from("images").select("id, file_path").in("id", imageIds)
      : Promise.resolve({ data: [] as any[] }),
    db
      .from("guests")
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds)
      .gte("check_in_time", dayStart),
  ]);

  const imageById = new Map<string, string | null>();
  for (const img of (imageRows as any).data || []) {
    imageById.set(img.id, resolveImageUrl(db, img.file_path));
  }

  const events: DoorEvent[] = list.map((e: any, i: number) => ({
    id: e.id,
    name: e.name || "Untitled event",
    date: e.date || null,
    time: e.time || null,
    location: e.location || null,
    imageUrl: e.image_id ? imageById.get(e.image_id) || null : null,
    phase: phaseFor(e.date, today),
    checkedIn: counts[i].checkedIn,
    total: counts[i].total,
  }));

  const active = events.filter((e) => e.phase === "active");
  return {
    events,
    summary: {
      activeEvents: active.length,
      scannedToday: (scannedTodayRes as any).count || 0,
      notCheckedIn: active.reduce(
        (sum, e) => sum + Math.max(0, e.total - e.checkedIn),
        0
      ),
    },
  };
}

/** The event if this organiser owns it, otherwise null. */
export async function loadScannerEvent(eventId: string, userId: string) {
  const db = getServerSupabase();
  const { data } = await db
    .from("events")
    .select("id, name, date, time, location")
    .eq("id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  return data || null;
}

export async function loadEventScanStats(eventId: string): Promise<EventScanStats> {
  const db = getServerSupabase();
  const [total, checkedIn, last] = await Promise.all([
    countGuests(eventId, "ticketed"),
    countGuests(eventId, "checkedIn"),
    db
      .from("guests")
      .select("check_in_time")
      .eq("event_id", eventId)
      .not("check_in_time", "is", null)
      .order("check_in_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    checkedIn,
    total,
    rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    lastScanAt: last.data?.check_in_time ? String(last.data.check_in_time) : null,
  };
}

/** Call only after the caller has checked access to the event. */
export async function loadRecentScans(eventId: string, limit = 8): Promise<RecentScan[]> {
  const rows = await loadScanHistoryServer(eventId, limit);
  return rows.map((row: any) => ({
    id: String(row.id),
    guestName: String(row.guestName || "Guest"),
    ticketType: String(row.ticketType || "Ticket"),
    checkInTime: String(row.check_in_time),
  }));
}

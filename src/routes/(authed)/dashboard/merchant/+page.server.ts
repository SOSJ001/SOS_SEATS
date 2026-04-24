import type { PageServerLoad } from "./$types";

type OrderRow = {
  event_id: string;
  total_amount: number | string | null;
  payment_status: string | null;
};

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user_Id } = await parent();
  if (!user_Id) {
    return {
      merchantEvents: [] as Array<{
        id: string;
        name: string;
        date: string | null;
        time: string | null;
        location: string | null;
        status: string | null;
        imageUrl: string | null;
        orderCount: number;
        revenue: number;
      }>,
    };
  }

  const { supabase } = locals;

  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id, name, date, time, location, status, image_id")
    .eq("user_id", user_Id)
    .order("created_at", { ascending: false });

  if (evErr || !events?.length) {
    return {
      merchantEvents: [],
    };
  }

  const eventIds = events.map((e) => e.id);
  const imageIds = [
    ...new Set(events.map((e) => e.image_id).filter(Boolean)),
  ] as string[];

  const imageMap = new Map<string, string>();
  if (imageIds.length) {
    const { data: images } = await supabase
      .from("images")
      .select("id, file_path")
      .in("id", imageIds);
    for (const img of images || []) {
      if (img?.id && img.file_path) imageMap.set(img.id, img.file_path);
    }
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("event_id, total_amount, payment_status")
    .in("event_id", eventIds)
    .in("payment_status", ["paid", "completed"]);

  const byEvent = new Map<string, { count: number; revenue: number }>();
  for (const id of eventIds) {
    byEvent.set(id, { count: 0, revenue: 0 });
  }

  for (const row of (orders || []) as OrderRow[]) {
    const agg = byEvent.get(row.event_id);
    if (!agg) continue;
    agg.count += 1;
    const amt =
      typeof row.total_amount === "string"
        ? parseFloat(row.total_amount)
        : row.total_amount || 0;
    agg.revenue += Number.isFinite(amt) ? amt : 0;
  }

  const merchantEvents = events.map((e) => {
    const agg = byEvent.get(e.id) || { count: 0, revenue: 0 };
    const imageUrl = e.image_id ? imageMap.get(e.image_id) ?? null : null;
    return {
      id: e.id,
      name: e.name,
      date: e.date,
      time: e.time,
      location: e.location,
      status: e.status,
      imageUrl,
      orderCount: agg.count,
      revenue: agg.revenue,
    };
  });

  return {
    merchantEvents,
  };
};

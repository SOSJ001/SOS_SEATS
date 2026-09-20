import { getServerSupabase } from "$lib/server/db";
import {
  PRIVATE_ISSUE_FEE_NLE,
  privateIssueFeeTotal,
} from "$lib/server/payments";

const supabase = getServerSupabase();

export async function load({ url, locals }) {
  const eventId = url.searchParams.get("id");
  const qty = Math.max(1, Math.floor(Number(url.searchParams.get("qty")) || 1));
  const paymentMethod = paymentMethodLabel(url.searchParams.get("method"));

  if (!eventId) {
    return {
      status: 400,
      error: "Event ID is required",
      qty,
      feeEach: PRIVATE_ISSUE_FEE_NLE,
      feeTotal: privateIssueFeeTotal(qty),
      paymentMethod,
      timestamp: formatTimestamp(new Date()),
    };
  }

  const userId = locals.userId;
  if (!userId) {
    return {
      status: 401,
      error: "Unauthorized",
      qty,
      feeEach: PRIVATE_ISSUE_FEE_NLE,
      feeTotal: privateIssueFeeTotal(qty),
      paymentMethod,
      timestamp: formatTimestamp(new Date()),
    };
  }

  const { data: event, error } = await supabase
    .from("events")
    .select("id, name, date, time, location, image_id, user_id")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error || !event) {
    return {
      status: 404,
      error: "Event not found",
      qty,
      feeEach: PRIVATE_ISSUE_FEE_NLE,
      feeTotal: privateIssueFeeTotal(qty),
      paymentMethod,
      timestamp: formatTimestamp(new Date()),
    };
  }

  let imageUrl = null;
  if (event.image_id) {
    const { data: imageData } = await supabase
      .from("images")
      .select("file_path")
      .eq("id", event.image_id)
      .maybeSingle();
    const path = imageData?.file_path || null;
    if (path) {
      if (String(path).startsWith("http")) {
        imageUrl = path;
      } else {
        const { data: urlData } = supabase.storage
          .from("event_images")
          .getPublicUrl(path);
        imageUrl = urlData?.publicUrl || path;
      }
    }
  }

  return {
    event: {
      id: event.id,
      title: event.name,
      date: formatEventDate(event.date, event.time),
      location: event.location,
      image: imageUrl,
    },
    qty,
    feeEach: PRIVATE_ISSUE_FEE_NLE,
    feeTotal: privateIssueFeeTotal(qty),
    paymentMethod,
    timestamp: formatTimestamp(new Date()),
  };
}

function paymentMethodLabel(method) {
  if (method === "orange_money") return "Orange Money";
  if (method === "afrimoney") return "Afrimoney";
  return "Wallet Balance";
}

function formatEventDate(date, time) {
  if (!date) return "Date TBD";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (!time) return datePart;
  try {
    const iso = `${date}T${time.length === 5 ? `${time}:00` : time}`;
    const t = new Date(iso);
    if (!Number.isNaN(t.getTime())) {
      const timePart = t.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${datePart} · ${timePart}`;
    }
  } catch {
    /* ignore */
  }
  return `${datePart} · ${time}`;
}

function formatTimestamp(d) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const datePart = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${datePart} · ${hh}:${mm}`;
}

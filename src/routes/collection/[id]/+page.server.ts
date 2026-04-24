import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = params.id?.trim();
  if (!id || !UUID_RE.test(id)) {
    throw error(400, "Invalid ticket id");
  }

  const { data, error: rpcErr } = await locals.supabase.rpc(
    "get_collection_ticket_display",
    { p_id: id }
  );

  if (rpcErr) {
    throw error(500, rpcErr.message);
  }

  let card: Record<string, unknown> | null = null;
  if (typeof data === "string") {
    try {
      card = JSON.parse(data) as Record<string, unknown>;
    } catch {
      card = null;
    }
  } else if (data && typeof data === "object") {
    card = data as Record<string, unknown>;
  }

  if (!card || Object.keys(card).length === 0) {
    throw error(404, "Ticket not found");
  }

  return { card };
};

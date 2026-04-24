import { json } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export async function POST({ cookies }) {
  const supabase = createSupabaseServerClient(cookies);
  await supabase.auth.signOut();

  cookies.delete("userSession", { path: "/" });
  cookies.delete("web3Session", { path: "/" });

  return json({}, { status: 201 });
}

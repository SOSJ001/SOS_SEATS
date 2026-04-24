import { redirect } from "@sveltejs/kit";
import { validateSession } from "$lib/sessionUtils.js";

/**
 * Primary path today: Web3 (`web3Session` via `web3LoginApi`) — `getUser()` is null,
 * so we use `validateSession` and `sessionType: "web3"`.
 * When email/password login is used, Supabase JWT cookies apply first so RLS can match `auth.uid()`.
 */
export async function load({ cookies, locals }) {
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (user?.id) {
    return {
      user_Id: user.id,
      sessionType: "traditional",
    };
  }

  const { valid, user_Id, sessionType } = validateSession(cookies);

  if (!valid) {
    throw redirect(302, "/");
  }

  return { user_Id, sessionType };
}

import { redirect } from "@sveltejs/kit";
import { validateSession } from "$lib/sessionUtils.js";

export function load({ cookies }) {
  const { valid, user_Id, sessionType } = validateSession(cookies);

  if (!valid) {
    console.log("No valid session found");
    // Uncomment the line below to redirect unauthenticated users
    throw redirect(302, '/');
  }

  return { user_Id, sessionType };
}

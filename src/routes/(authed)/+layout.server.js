import { redirect } from "@sveltejs/kit";

export function load({ locals }) {
  const user_Id = locals.userId;
  const sessionType = locals.sessionType;

  if (!user_Id) {
    throw redirect(302, "/");
  }

  return { user_Id, sessionType };
}

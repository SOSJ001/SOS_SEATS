import { redirect } from "@sveltejs/kit";

export function load({ params }) {
  throw redirect(307, `/dashboard/events/editEvent/${params.eventId}/step1`);
}

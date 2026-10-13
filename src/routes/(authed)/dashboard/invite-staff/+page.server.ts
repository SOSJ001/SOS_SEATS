import type { PageServerLoad } from "./$types";
import { listOrganizerStaff, loadStaffEligibleEvents } from "$lib/server/staff";

/** Invite Staff (roadmap 7.3): your active staff and the events you can assign. */
export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.userId;
  if (!userId) {
    return { staff: [], eligibleEvents: [], loadError: false };
  }

  try {
    const [staff, eligibleEvents] = await Promise.all([
      listOrganizerStaff(userId),
      loadStaffEligibleEvents(userId),
    ]);
    return { staff, eligibleEvents, loadError: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Invite staff load failed:", message);
    return { staff: [], eligibleEvents: [], loadError: true };
  }
};

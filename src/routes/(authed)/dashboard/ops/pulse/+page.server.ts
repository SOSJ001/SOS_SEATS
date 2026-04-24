import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();
  if (!data.isOpsAdmin) {
    throw error(403, "Not authorized");
  }
  return {};
};

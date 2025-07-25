import { json } from "@sveltejs/kit";
import { parseSession } from "$lib/sessionUtils.js";

export async function GET({ cookies }) {
  try {
    const sessionData = parseSession(cookies);
    
    return json({
      success: true,
      session: sessionData
    });
  } catch (error) {
    console.error("Error in debug-session:", error);
    return json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 
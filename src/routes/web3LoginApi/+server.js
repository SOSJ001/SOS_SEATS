import { json } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
  try {
    const { sessionData } = await request.json();

    // Validate session data
    if (!sessionData || !sessionData.wallet_address || !sessionData.user) {
      return json({ error: "Invalid session data" }, { status: 400 });
    }

    // Set Web3 session cookie
    const user = JSON.stringify(sessionData);
    cookies.set("web3Session", user, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return json({ success: true }, { status: 201 });
  } catch (error) {
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

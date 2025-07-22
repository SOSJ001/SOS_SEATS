import { json } from "@sveltejs/kit";

export async function POST({ cookies }) {
    try {
        // Delete the Web3 session cookie
        cookies.delete("web3Session", { path: "/" });
        return json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Web3 logout error:", error);
        return json({ error: "Internal server error" }, { status: 500 });
    }
} 
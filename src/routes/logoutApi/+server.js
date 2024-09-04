import { json } from "@sveltejs/kit";

export async function POST({ cookies }) {
    // delete the cookie
    cookies.delete("userSession", { path: "/" });
     return json({}, { status: 201 });
}

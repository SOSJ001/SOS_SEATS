
import { json } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
    const { sessionData } = await request.json();
    const COOKIE_DATA = sessionData.user
    const user = JSON.stringify(COOKIE_DATA)
    cookies.set('userSession', user, { path: '/' });
        return json({  }, { status: 201 });

}
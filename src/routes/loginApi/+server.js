import { loginbtnFunction } from "$lib/supabase";
import { json } from "@sveltejs/kit";

export async function POST({ request, cookies }) {
    const { email1, pass } = await request.json();

    const { SessionFromdb } = await loginbtnFunction(email1, pass);
    let supabaseError = SessionFromdb.error;
    let supabaseSession = SessionFromdb.data.session;
    // let supabaseSession1 = SessionFromdb.data.user;
    if (SessionFromdb.error !== null) {
        supabaseSession = null;
        return json({ supabaseError, supabaseSession }, { status: 201 });

    } else if (SessionFromdb.data !== null) {
        supabaseError = null;
        // @ts-ignore
        cookies.set('userSession', supabaseSession?.user.id, { path: '/' });
        const cookievar = cookies.get('userSession');
        return json({ supabaseSession, supabaseError, cookievar }, { status: 201 });
    }

}
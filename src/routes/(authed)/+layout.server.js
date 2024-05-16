import { sessionFromDb } from "$lib/variable";
import { redirect } from "@sveltejs/kit";

export function load({ cookies, locals }) {
    const cookievar = cookies.get('userSession')
    if (!cookievar) {
        console.log('cookie not set');
        throw redirect(302, '/')  
    } 
}
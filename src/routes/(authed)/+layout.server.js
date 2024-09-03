import { redirect } from "@sveltejs/kit";

export function load({ cookies }) {
    const COOKIE_DATA = cookies.get('userSession')
    if (COOKIE_DATA === undefined || COOKIE_DATA === null) {
        throw redirect(302, '/')  
    } 
}
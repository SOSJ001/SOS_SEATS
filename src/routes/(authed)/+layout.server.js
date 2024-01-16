import { sessionFromDb } from '$lib/variable.js';
import { redirect } from "@sveltejs/kit";

export function load({ cookies, url }) {
    // if (!cookies.get('userSession')) {
    //     throw redirect(303, '/');
    // } 
    // this didn't work as it prevented my code from executing
    if (sessionFromDb === null) {
        throw redirect(303, '/');
    }
}
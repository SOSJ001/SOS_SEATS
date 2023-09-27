import { sessionFromDb } from '$lib/variable.js';
import { redirect } from "@sveltejs/kit";

export function load({ cookies, url }) {
    if (!cookies.get('userSession')) {
        throw redirect(303, '/');
    }
}
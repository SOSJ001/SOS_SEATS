import { redirect } from "@sveltejs/kit";

export function load({ cookies }) {
    let COOKIE_DATA = cookies.get('userSession')
    if (COOKIE_DATA === undefined || COOKIE_DATA === null) {
        throw redirect(302, '/')  
    } 
    COOKIE_DATA = JSON.parse(COOKIE_DATA)
    // @ts-ignore
    const user_Id = COOKIE_DATA?.id
    return {user_Id}
}
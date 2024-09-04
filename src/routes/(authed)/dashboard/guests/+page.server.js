//@ts-nocheck
import { loadGuestsRows } from "$lib/supabase";

export async function load({ cookies }) {
     let COOKIE_DATA = cookies.get("userSession");
     COOKIE_DATA = JSON.parse(COOKIE_DATA);
     const user_Id = COOKIE_DATA?.id;
    let loadGuestsData = await loadGuestsRows(user_Id);
    return{loadGuestsData}
}

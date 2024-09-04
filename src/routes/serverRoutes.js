import { supabase } from '$lib/supabase';
import { sessionFromDb } from '$lib/store';





//signout button below

export let signout = async () => {
    const response = await fetch("./logoutApi"); //logout api to cancel the cookie and logout.
    // @ts-ignore
    const { logoutResponse, cookievar1 } = await response.json();
    if (cookievar1 === '') {
        sessionFromDb.set('');
    }
};





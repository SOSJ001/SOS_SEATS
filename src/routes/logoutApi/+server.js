import { signOutbtnFunction } from "$lib/supabase";
import { json } from "@sveltejs/kit";

export async function GET({ cookies }) {

    const { SessionFromdb } = await signOutbtnFunction();
    let logoutResponse;    
    if( SessionFromdb.error !== null ){
        //if the signout has error return the error
        logoutResponse = SessionFromdb.error
        return json({ logoutResponse }, { status: 201 });
    }else{
        // if the signout is a success resrt the cookie and return the response
        cookies.set('userSession', '', { path: '/' });
        const cookievar1 = cookies.get('userSession');
        logoutResponse = "Successfully logged out"
        return json({ logoutResponse, cookievar1 }, { status: 201 })
    }

}

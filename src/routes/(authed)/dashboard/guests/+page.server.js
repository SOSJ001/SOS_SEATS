//@ts-nocheck
import { loadGuestsRows } from "$lib/supabase";

export async function load({ cookies }) {
     let userSession = cookies.get("userSession");
     let web3Session = cookies.get("web3Session");
     let user_Id = null;

     // Check traditional session first
     if (userSession) {
       try {
         const sessionData = JSON.parse(userSession);
         user_Id = sessionData.id;
       } catch (error) {
         }
     }
     
     // Check Web3 session if no traditional session
     if (!user_Id && web3Session) {
       try {
         const sessionData = JSON.parse(web3Session);
         if (sessionData.type === 'web3' && sessionData.user) {
           user_Id = sessionData.user.id;
         }
       } catch (error) {
         }
     }
    let loadGuestsData = await loadGuestsRows(user_Id);
    return{loadGuestsData}
}

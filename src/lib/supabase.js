import { createClient } from '@supabase/supabase-js'
export const supabase = createClient('https://qwoklzpfoblqmnategny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs')

import { sessionFromDb } from './variable';


// login finction
// @ts-ignore
export async function loginbtnFunction(email1, password1) {

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email1,
        password: password1,
    });

    return {
        SessionFromdb: {
            data,
            error
        }
    };

}

// Signout function below
export async function signOutbtnFunction() {

    const { error } = await supabase.auth.signOut();

    return {
        SessionFromdb: {
            error
        }
    };

}


export function generateUniqueFilename() {
    const timestamp = Date.now(); // Get the current timestamp
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string

    const uniqueFilename = `${timestamp}_${randomString}`; // Combine timestamp and random string

    return uniqueFilename;
}


// load event to the table 
export async function loadEventToTable() {

    let { data: event, error } = await supabase
        .from('event')
        .select('*')
        if(error){
            console.log("loadEventToTable error", error.message)
        }else{
            // console.log("loadEventToTable #Success", event)
            return event
        }

}

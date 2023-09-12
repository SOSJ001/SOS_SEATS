import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://qwoklzpfoblqmnategny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs')



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
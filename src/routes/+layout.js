import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://qwoklzpfoblqmnategny.supabase.co'
const PublicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs"
const supabase = createClient( supabaseUrl, PublicAnonKey)


export function load({  }) {
	//TODO HERE
	
	return {
        supabase
    };
}


import { createClient } from '@supabase/supabase-js'
export const supabase = createClient('https://qwoklzpfoblqmnategny.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b2tsenBmb2JscW1uYXRlZ255Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIzMDYxMDksImV4cCI6MjAwNzg4MjEwOX0.BktZ0VzqqY5Wn8wjXfgIKBMdNauNx5-ZChMOnw9vbcs')

// @ts-ignore
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
    let { data: events, error } = await supabase
        .from('event')
        .select('*');

    if (error) {
        console.log("loadEventToTable error", error.message);
        return [];
    }

    // Use Promise.all to await all image requests
    // @ts-ignore
    const eventWithImages = await Promise.all(events.map(async (Event, i) => {
        const Images = await SelectImagePath(Event.imageId);
        // @ts-ignore
        // console.log('image HERE', Images, i);

        return {
            Event: Event,
            // @ts-ignore
            Image: Images
        };
    }));

    return eventWithImages;
}

// SELECT IMAGE PATH FROM image Table
// @ts-ignore
async function SelectImagePath(imageId) {
    let { data: image, error } = await supabase
        .from('image')
        .select("*")
        .eq('id', imageId);

    if (error) {
        console.error('Error selecting image path:', error.message);
        return null; // You should handle errors appropriately
    } else {
        // const ImageUrl = await GetImageUrl()
        // console.log('This is the image URL',image[0].fileName);
        const images = await GetImageUrl(image[0].fileName);
        // console.log('Public url here so ', images)
        return images;

    }

    // return image;
}


// get public url for the Event Image below
async function GetImageUrl(fileName) {
    const { data } = supabase
        .storage
        .from('event_image')//Bucket id
        .getPublicUrl(fileName)

// console.log('Image Url here so', data.publicUrl);
return data.publicUrl;
}
import { supabase } from '$lib/supabase';
import { sessionFromDb } from '$lib/variable';
import { generateUniqueFilename } from '$lib/supabase';




//signout button below

export let signout = async () => {
    const response = await fetch("./logoutApi"); //logout api to cancel the cookie and logout.
    // @ts-ignore
    const { logoutResponse, cookievar1 } = await response.json();
    if (cookievar1 === '') {
        sessionFromDb.set('');
    }
};








// upload image function
// @ts-ignore
async function uploadEventImage(image, userId1) {

    const avatarFile = image.files[0]
    let flyerName = `public/${generateUniqueFilename() + avatarFile.name}`;
    // @ts-ignore
    //uploading the flyer for the event
    console.log("random ", generateUniqueFilename());
    const { data, error } = await supabase
        .storage
        .from('event_image')
        .upload(`${flyerName}`, avatarFile, {
            cacheControl: '3600',
            upsert: false
        })
    if (data) {
        //if the flyer is uploaded successfully insert the flyer name along side the userid into the image table
        const { data, error } = await supabase
            .from('image')
            .insert([
                { fileName: flyerName, userId: userId1 },
            ])
            .select()

        if (data) {
            // console.log("Upload success ", data[0].id);
            const imageId = data[0].id
            return imageId;
        } else {
            console.log("Insert Image Error ", error.message);

        }
        // console.log(sessionFromDb);
        // return;

    } else {
        // return {
        console.log("Error Uploading Image ", error.message);

        // };
    }
    // console.log(avatarFile);
}



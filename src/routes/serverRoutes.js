import { sessionFromDb } from '$lib/variable';

//signout button below

export let signout = async () => {
    console.log('Before ', sessionFromDb);
    const response = await fetch("./logoutApi"); //logout api to cancel the cookie and logout
    const { logoutResponse, cookievar1 } = await response.json();
    if (cookievar1 === '') {
        sessionFromDb.set(null);
        // console.log('After ', sessionFromDb);
        // console.log('Data From logout api ', logoutResponse);
        // console.log('Cookievari logout', cookievar1);

    }
};
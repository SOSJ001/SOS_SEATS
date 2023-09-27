
export function load({ cookies }) {
    let cookievar1

    if (cookies.get('userSession')) {
        cookievar1 = cookies.get('userSession');
    }

    return {
        cookievar1
    };
}
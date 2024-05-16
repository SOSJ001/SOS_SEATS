export function load({ cookies }) {
    let cookievar1 = cookies.get('userSession')
    return { cookievar1 };
}
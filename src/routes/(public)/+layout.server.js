export async function load({ locals }) {
    const userName = locals.userName;
    return { userName };
}
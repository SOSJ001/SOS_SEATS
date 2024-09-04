export function load({ cookies }) {
  const userSession = cookies.get("userSession");
  let cookievar1;
  if (userSession !== undefined) {
      cookievar1 = JSON.parse(userSession).id;
  } else {
    cookievar1 = null;
  }
  return { cookievar1 };
}

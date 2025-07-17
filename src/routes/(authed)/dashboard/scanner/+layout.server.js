export async function load({ locals }) {
  // Get user data from locals (set by the parent layout)
  const user = locals.user;

  return {
    user: user || null,
    userName: user?.user_metadata?.full_name || user?.email || "User",
  };
}

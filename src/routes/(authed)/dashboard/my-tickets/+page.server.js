export async function load({ locals }) {
  try {
    return {
      walletAddress: locals.walletAddress,
      sessionType: locals.sessionType,
      userName: locals.userName,
      userId: locals.userId,
    };
  } catch (error) {
    console.error("Error in my-tickets server load:", error);
    return {
      walletAddress: null,
      sessionType: null,
      userName: null,
      userId: null,
    };
  }
}

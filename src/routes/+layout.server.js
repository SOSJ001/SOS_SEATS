export function load({ locals }) {
  return {
    cookievar1: locals.userId,
    sessionType: locals.sessionType,
    walletAddress: locals.walletAddress,
    userName: locals.userName,
    linkedWalletAddress: locals.linkedWalletAddress,
    web3UserId: locals.web3UserId,
  };
}

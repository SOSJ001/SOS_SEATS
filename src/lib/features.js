/**
 * Product feature switches.
 * WEB3_ENABLED: Solana wallet sign-in, multisig withdrawals and signer approvals.
 * The server routes for these flows are removed or return 410, so turning this
 * back on also needs those routes rebuilt with signed sessions.
 */
export const WEB3_ENABLED = false;

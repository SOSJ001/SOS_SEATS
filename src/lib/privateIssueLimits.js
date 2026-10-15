export const PRIVATE_ISSUE_MAX_QTY = 500;

/** Fixed private ticket issue fee per ticket (NLe). */
export const PRIVATE_ISSUE_FEE_NLE = 0.99;

/** Mobile money top-up on the private issue fee, so the fee is covered after Monime's cut. */
export const PRIVATE_ISSUE_MM_FEE_RATE = 0.01;

/** @param {number} qty */
export function privateIssueFeeTotal(qty) {
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  return Math.round(n * PRIVATE_ISSUE_FEE_NLE * 100) / 100;
}

/**
 * Exact mobile money charge in cents (fee plus the 1% top-up). The Pay now page
 * and the payment-code route both use this, so they always agree.
 * @param {number} qty
 */
export function privateIssueChargeCents(qty) {
  const fee = privateIssueFeeTotal(qty);
  return Math.round(fee * (1 + PRIVATE_ISSUE_MM_FEE_RATE) * 100);
}

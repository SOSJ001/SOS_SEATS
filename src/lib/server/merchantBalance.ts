import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Available mobile-money balance for an organizer: completed Orange/Afrimoney orders
 * for their events minus completed/paid withdrawals on the given wallet.
 * Mirrors logic in dashboard wallet `loadMobileMoneyTotal`.
 */
export async function getAvailableMobileMoneyBalance(
  supabase: SupabaseClient,
  userId: string,
  walletAddress: string
): Promise<{ available: number; currency: string }> {
  const currency = "NLe";

  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id")
    .eq("user_id", userId);

  if (evErr || !events?.length) {
    return { available: 0, currency };
  }

  const eventIds = events.map((e) => e.id);

  const { data: rows, error: ordErr } = await supabase
    .from("orders")
    .select("total_amount")
    .in("event_id", eventIds)
    .in("payment_method", ["orange_money", "afrimoney"])
    .in("payment_status", ["paid", "completed"]);

  if (ordErr) {
    return { available: 0, currency };
  }

  const totalDeposits = (rows || []).reduce((sum: number, r: { total_amount?: unknown }) => {
    const amt =
      typeof r.total_amount === "string"
        ? parseFloat(r.total_amount)
        : (r.total_amount as number) || 0;
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);

  let totalWithdrawals = 0;
  if (walletAddress) {
    const { data: withdrawals, error: wErr } = await supabase
      .from("wallet_transactions")
      .select("amount")
      .eq("wallet_address", walletAddress)
      .in("source", ["mobile_money", "orange_money", "afrimoney"])
      .eq("type", "withdrawal")
      .in("status", ["completed", "paid"]);

    if (!wErr && withdrawals?.length) {
      totalWithdrawals = withdrawals.reduce(
        (sum: number, t: { amount?: unknown }) => {
          const amt =
            typeof t.amount === "string"
              ? parseFloat(t.amount)
              : (t.amount as number) || 0;
          return sum + Math.abs(Number.isFinite(amt) ? amt : 0);
        },
        0
      );
    }
  }

  return {
    available: Math.max(0, totalDeposits - totalWithdrawals),
    currency,
  };
}

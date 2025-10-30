<script lang="ts">
  import WalletBalance from "$lib/components/WalletBalance.svelte";
  import PortfolioOverview from "$lib/components/PortfolioOverview.svelte";
  import RecentTransactions from "$lib/components/RecentTransactions.svelte";
  import NetworkStatus from "$lib/components/NetworkStatus.svelte";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getBalance, getActiveWalletAddress } from "$lib/web3";

  export const data = undefined;

  // Animation states
  let isLoaded = false;
  let showContent = false;

  // Dynamic balances
  let solBalance: string | null = null; // on-chain SOL balance (optional)
  let mobileMoneyTotal: number = 0;
  let solanaOrdersTotal: number = 0;
  let totalRevenue: number = 0;
  let totalDisplay: string = "--";
  let recentTx: any[] = [];
  function handleWithdrawMobileMoney() {
    // Create a pending withdrawal request in wallet_transactions
    (async () => {
      try {
        if (mobileMoneyTotal <= 0) return;
        const session = await verifyWeb3Session();
        const wallet =
          session?.success && session.user?.wallet_address
            ? session.user.wallet_address
            : null;
        if (!wallet) {
          alert("Connect wallet to withdraw.");
          return;
        }
        // Derive currency from latest mobile money order if possible
        let currency = "USD";
        const { data: mmOrder } = await supabase
          .from("orders")
          .select("currency")
          .eq("buyer_wallet_address", wallet)
          .eq("payment_method", "mobile_money")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mmOrder?.currency) currency = mmOrder.currency;

        await supabase.from("wallet_transactions").insert([
          {
            wallet_address: wallet,
            type: "withdrawal",
            source: "mobile_money",
            amount: -Number(mobileMoneyTotal || 0),
            currency: currency,
            status: "pending",
            metadata: { note: "User-initiated withdrawal from wallet page" },
          },
        ]);

        alert("Withdrawal request submitted.");
        await loadRecentTransactions();
      } catch (e) {
        alert("Failed to submit withdrawal request.");
      }
    })();
  }

  async function loadMobileMoneyTotal() {
    try {
      const session = await verifyWeb3Session();
      const wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;

      if (!wallet) {
        mobileMoneyTotal = 0;
        return;
      }

      // Sum completed mobile money orders for this wallet
      const { data: rows, error } = await supabase
        .from("orders")
        .select("total_amount,payment_status")
        .eq("buyer_wallet_address", wallet)
        .eq("payment_method", "mobile_money")
        .in("payment_status", ["paid", "completed"]);

      if (error || !rows) {
        mobileMoneyTotal = 0;
        return;
      }

      mobileMoneyTotal = rows.reduce((sum: number, r: any) => {
        const amt =
          typeof r.total_amount === "string"
            ? parseFloat(r.total_amount)
            : r.total_amount || 0;
        return sum + (isFinite(amt) ? amt : 0);
      }, 0);
    } catch (_) {
      mobileMoneyTotal = 0;
    }
  }

  async function loadOrderTotals() {
    try {
      const session = await verifyWeb3Session();
      const wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return;
      }

      const { data: rows } = await supabase
        .from("orders")
        .select("total_amount, payment_method, payment_status")
        .eq("buyer_wallet_address", wallet)
        .in("payment_status", ["paid", "completed"]);

      const sumBy = (method: string) =>
        (rows || [])
          .filter((r: any) => r.payment_method === method)
          .reduce((sum: number, r: any) => {
            const amt =
              typeof r.total_amount === "string"
                ? parseFloat(r.total_amount)
                : r.total_amount || 0;
            return sum + (isFinite(amt) ? amt : 0);
          }, 0);

      solanaOrdersTotal = sumBy("solana");
      // mobileMoneyTotal already computed separately; ensure not double work
      if (mobileMoneyTotal === 0) {
        mobileMoneyTotal = sumBy("mobile_money");
      }
      totalRevenue = (solanaOrdersTotal || 0) + (mobileMoneyTotal || 0);
      totalDisplay = totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (_) {
      totalRevenue = mobileMoneyTotal || 0;
      totalDisplay = totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }

  async function loadRecentTransactions() {
    try {
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) return;

      const { data: orders } = await supabase
        .from("orders")
        .select(
          "id, created_at, total_amount, currency, payment_method, payment_status, order_number, events(name)"
        )
        .eq("buyer_wallet_address", wallet)
        .order("created_at", { ascending: false })
        .limit(10);

      const fromOrders = (orders || []).map((o: any) => ({
        id: o.id,
        type: o.payment_method,
        description: `${o.payment_method === "mobile_money" ? "Mobile Money" : "Web3"}: ${o.events?.name || "Order"} #${o.order_number}`,
        date: new Date(o.created_at).toLocaleString(),
        amount:
          `+ ${Number(o.total_amount || 0).toFixed(2)} ${o.currency || ""}`.trim(),
        status: o.payment_status || "completed",
        icon: o.payment_method === "mobile_money" ? "deposit" : "ticket",
      }));

      const { data: ledger } = await supabase
        .from("wallet_transactions")
        .select(
          "id, created_at, amount, currency, type, source, status, external_id"
        )
        .eq("wallet_address", wallet)
        .order("created_at", { ascending: false })
        .limit(10);

      const fromLedger = (ledger || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        description: `${t.type === "withdrawal" ? "Withdrawal" : t.type === "deposit" ? "Deposit" : t.type}: ${t.source}`,
        date: new Date(t.created_at).toLocaleString(),
        amount:
          `${t.amount >= 0 ? "+ " : ""}${Number(t.amount || 0).toFixed(2)} ${t.currency || ""}`.trim(),
        status: t.status || "pending",
        icon:
          t.type === "withdrawal"
            ? "withdrawal"
            : t.type === "deposit"
              ? "deposit"
              : "ticket",
      }));

      recentTx = [...fromLedger, ...fromOrders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    } catch (_) {
      recentTx = [];
    }
  }

  onMount(() => {
    // Trigger entrance animations
    setTimeout(() => {
      isLoaded = true;
    }, 100);

    setTimeout(() => {
      showContent = true;
    }, 300);

    // Load balances
    (async () => {
      await loadMobileMoneyTotal();
      await loadOrderTotals();
      await loadRecentTransactions();
      // Load SOL balance from chain
      try {
        const session = await verifyWeb3Session();
        let wallet =
          session?.success && session.user?.wallet_address
            ? session.user.wallet_address
            : null;
        if (!wallet) {
          wallet = getActiveWalletAddress();
        }
        if (wallet) {
          const bal = await getBalance(wallet);
          if (bal !== null && bal !== undefined) {
            solBalance = `${bal.toFixed(3)} SOL`;
          } else {
            solBalance = "-- SOL";
          }
        } else {
          solBalance = "-- SOL";
        }
      } catch (_) {
        solBalance = "-- SOL";
      }
    })();
  });

  function handleSend() {
    // Implementation for sending transaction
  }

  function handleReceive() {
    // Implementation for receiving transaction
  }

  function handleSwap() {
    // Implementation for swapping tokens
  }
</script>

<div class="min-h-screen bg-gray-900 text-white px-4 py-6">
  <!-- Header -->
  <div
    class="mb-6 transition-all duration-1000 transform {isLoaded
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">My Wallet</h1>
    <p class="text-gray-400 text-sm md:text-base">
      Manage your cryptocurrency assets and transactions
    </p>
  </div>

  <!-- Main Content Grid -->
  <div
    class="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8 transition-all duration-1000 transform {showContent
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <!-- Left Column - Balance and Portfolio -->
    <div class="lg:col-span-2 space-y-6 lg:space-y-8">
      <!-- Current Balance (Web3) -->
      <WalletBalance
        balance={totalDisplay}
        onSend={handleSend}
        onReceive={handleReceive}
        onSwap={handleSwap}
      />

      <!-- Mobile Money Total -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
        >
          <div class="text-sm text-gray-400 mb-1">Mobile Money Balance</div>
          <div class="text-2xl font-bold text-white">
            {mobileMoneyTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            All completed mobile money orders
          </div>
          <div class="pt-1">
            <button
              on:click={handleWithdrawMobileMoney}
              disabled={mobileMoneyTotal <= 0}
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                {mobileMoneyTotal > 0
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}"
            >
              Withdraw
            </button>
          </div>
        </div>
        <div
          class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
        >
          <div class="text-sm text-gray-400 mb-1">Solana Revenue</div>
          <div class="text-2xl font-bold text-white">
            {solanaOrdersTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div class="text-xs text-gray-500 mt-1">
            All completed Solana orders
          </div>
        </div>
      </div>

      <!-- Portfolio Overview -->
      <PortfolioOverview />

      <!-- Recent Transactions -->
      <RecentTransactions transactions={recentTx} />
    </div>

    <!-- Right Column - Network Status -->
    <div class="lg:col-span-1">
      <NetworkStatus />
    </div>
  </div>

  <!-- Glowing particles background effect -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div
      class="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 0s;"
    ></div>
    <div
      class="absolute top-1/3 right-1/3 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 1s;"
    ></div>
    <div
      class="absolute bottom-1/4 left-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 2s;"
    ></div>
    <div
      class="absolute bottom-1/3 right-1/4 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 0.5s;"
    ></div>
  </div>
</div>

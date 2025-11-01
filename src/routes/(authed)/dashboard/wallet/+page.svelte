<script lang="ts">
  import WalletBalance from "$lib/components/WalletBalance.svelte";
  import PortfolioOverview from "$lib/components/PortfolioOverview.svelte";
  import RecentTransactions from "$lib/components/RecentTransactions.svelte";
  import NetworkStatus from "$lib/components/NetworkStatus.svelte";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session, loadUserEvents } from "$lib/supabase";
  import { getBalance, getActiveWalletAddress } from "$lib/web3";
  import { sessionFromDb } from "$lib/store";
  import MaintenanceWrapper from "$lib/components/MaintenanceWrapper.svelte";

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

  // Loading states
  let isLoadingMobileMoney = true;
  let isLoadingSolana = true;
  let isLoadingTotal = true;
  let isLoadingTransactions = true;
  let isLoadingSolBalance = true;
  function handleWithdrawMobileMoney() {
    // Create a pending withdrawal request in wallet_transactions
    (async () => {
      try {
        if (mobileMoneyTotal <= 0) return;

        // Get user ID from session store
        const userId = $sessionFromDb;
        if (!userId) {
          alert("Please log in to withdraw.");
          return;
        }

        const session = await verifyWeb3Session();
        let wallet =
          session?.success && session.user?.wallet_address
            ? session.user.wallet_address
            : null;
        if (!wallet) {
          wallet = getActiveWalletAddress();
        }
        if (!wallet) {
          alert("Connect wallet to withdraw.");
          return;
        }

        // Get currency from latest mobile money order for events created by this user
        let currency = "SLE"; // Default to SLE for mobile money
        const userEvents = await loadUserEvents(userId, "traditional");
        const eventIds = userEvents.map((e: any) => e.id);

        if (eventIds.length > 0) {
          const { data: mmOrder } = await supabase
            .from("orders")
            .select("currency")
            .in("event_id", eventIds)
            .in("payment_method", ["orange_money", "afrimoney"])
            .in("payment_status", ["paid", "completed"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (mmOrder?.currency) currency = mmOrder.currency;
        }

        // Create withdrawal record in wallet_transactions
        const { error } = await supabase.from("wallet_transactions").insert([
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

        if (error) {
          console.error("Error creating withdrawal:", error);
          alert("Failed to submit withdrawal request.");
          return;
        }

        alert("Withdrawal request submitted.");
        await loadRecentTransactions();
      } catch (e) {
        console.error("Withdrawal error:", e);
        alert("Failed to submit withdrawal request.");
      }
    })();
  }

  async function loadMobileMoneyTotal() {
    isLoadingMobileMoney = true;
    try {
      // Get user ID from session store (same as dashboard)
      const userId = $sessionFromDb;

      if (!userId) {
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      if (eventIds.length === 0) {
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      // Sum completed mobile money orders for events created by this user
      const { data: rows, error } = await supabase
        .from("orders")
        .select("total_amount,payment_status,payment_method")
        .in("event_id", eventIds)
        .in("payment_method", ["orange_money", "afrimoney"])
        .in("payment_status", ["paid", "completed"]);

      if (error) {
        console.error("Error loading mobile money total:", error);
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      if (!rows || rows.length === 0) {
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      mobileMoneyTotal = rows.reduce((sum: number, r: any) => {
        const amt =
          typeof r.total_amount === "string"
            ? parseFloat(r.total_amount)
            : r.total_amount || 0;
        return sum + (isFinite(amt) ? amt : 0);
      }, 0);
    } catch (err) {
      console.error("Error in loadMobileMoneyTotal:", err);
      mobileMoneyTotal = 0;
    } finally {
      isLoadingMobileMoney = false;
    }
  }

  async function loadOrderTotals() {
    isLoadingSolana = true;
    isLoadingTotal = true;
    try {
      // Get user ID from session store (same as dashboard)
      const userId = $sessionFromDb;

      if (!userId) {
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        isLoadingSolana = false;
        isLoadingTotal = false;
        return;
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      if (eventIds.length === 0) {
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal || 0;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        isLoadingSolana = false;
        isLoadingTotal = false;
        return;
      }

      // Query orders for events created by this user
      const { data: rows, error } = await supabase
        .from("orders")
        .select("total_amount, payment_method, payment_status")
        .in("event_id", eventIds)
        .in("payment_status", ["paid", "completed"]);

      if (error) {
        console.error("Error loading order totals:", error);
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal || 0;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        isLoadingSolana = false;
        isLoadingTotal = false;
        return;
      }

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
        // Sum both orange_money and afrimoney for mobile money total
        mobileMoneyTotal = sumBy("orange_money") + sumBy("afrimoney");
      }
      totalRevenue = (solanaOrdersTotal || 0) + (mobileMoneyTotal || 0);
      totalDisplay = totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (err) {
      console.error("Error in loadOrderTotals:", err);
      totalRevenue = mobileMoneyTotal || 0;
      totalDisplay = totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } finally {
      isLoadingSolana = false;
      isLoadingTotal = false;
    }
  }

  async function loadRecentTransactions() {
    isLoadingTransactions = true;
    try {
      // Get user ID from session store (same as balances)
      const userId = $sessionFromDb;
      if (!userId) {
        recentTx = [];
        isLoadingTransactions = false;
        return;
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      // Get wallet address for wallet_transactions
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }

      // Query revenue orders (orders for events created by this user)
      let fromOrders: any[] = [];
      if (eventIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, created_at, total_amount, currency, payment_method, payment_status, order_number, events(name)"
          )
          .in("event_id", eventIds)
          .in("payment_status", ["paid", "completed"])
          .order("created_at", { ascending: false })
          .limit(10);

        if (ordersError) {
          console.error("Error loading revenue orders:", ordersError);
        } else {
          fromOrders = (orders || []).map((o: any) => ({
            id: o.id,
            type: o.payment_method,
            description: `${o.payment_method === "orange_money" || o.payment_method === "afrimoney" ? "Mobile Money" : "Web3"}: ${o.events?.name || "Event"} #${o.order_number}`,
            date: new Date(o.created_at).toLocaleString(),
            amount:
              `+ ${Number(o.total_amount || 0).toFixed(2)} ${o.currency || ""}`.trim(),
            status: o.payment_status || "completed",
            icon:
              o.payment_method === "orange_money" ||
              o.payment_method === "afrimoney"
                ? "deposit"
                : "ticket",
          }));
        }
      }

      // Query wallet_transactions (withdrawals, deposits)
      let fromLedger: any[] = [];
      if (wallet) {
        const { data: ledger, error: ledgerError } = await supabase
          .from("wallet_transactions")
          .select(
            "id, created_at, amount, currency, type, source, status, external_id"
          )
          .eq("wallet_address", wallet)
          .order("created_at", { ascending: false })
          .limit(10);

        if (ledgerError) {
          console.error("Error loading wallet transactions:", ledgerError);
        } else {
          fromLedger = (ledger || []).map((t: any) => ({
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
        }
      }

      // Combine and sort by date (most recent first)
      recentTx = [...fromLedger, ...fromOrders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    } catch (err) {
      console.error("Error in loadRecentTransactions:", err);
      recentTx = [];
    } finally {
      isLoadingTransactions = false;
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
      await Promise.all([
        loadMobileMoneyTotal(),
        loadOrderTotals(),
        loadRecentTransactions(),
      ]);
      // Load SOL balance from chain
      isLoadingSolBalance = true;
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
      } finally {
        isLoadingSolBalance = false;
      }
    })();
  });

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
        balance={isLoadingTotal ? "--" : totalDisplay}
        isLoading={isLoadingTotal}
      />

      <!-- Mobile Money Total -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
        >
          <div class="text-sm text-gray-400 mb-1">Mobile Money Balance</div>
          {#if isLoadingMobileMoney}
            <div class="text-2xl font-bold text-white flex items-center gap-2">
              <svg
                class="animate-spin h-5 w-5 text-cyan-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading...</span>
            </div>
          {:else}
            <div class="text-2xl font-bold text-white">
              {mobileMoneyTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          {/if}
          <div class="text-xs text-gray-500 mt-1">
            All completed mobile money orders
          </div>
          <div class="pt-1">
            <MaintenanceWrapper
              isUnderMaintenance={true}
              disableContent={true}
              compact={true}
              message="under maintenance"
              variant="default"
              showIcon={true}
            >
              <button
                on:click={handleWithdrawMobileMoney}
                disabled={mobileMoneyTotal <= 0 || isLoadingMobileMoney}
                class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                  {mobileMoneyTotal > 0 && !isLoadingMobileMoney
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'}"
              >
                Withdraw
              </button>
            </MaintenanceWrapper>
          </div>
        </div>

        <div
          class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
        >
          <div class="text-sm text-gray-400 mb-1">Solana Revenue</div>
          {#if isLoadingSolana}
            <div class="text-2xl font-bold text-white flex items-center gap-2">
              <svg
                class="animate-spin h-5 w-5 text-cyan-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading...</span>
            </div>
          {:else}
            <div class="text-2xl font-bold text-white">
              {solanaOrdersTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          {/if}
          <div class="text-xs text-gray-500 mt-1">
            All completed Solana orders
          </div>
        </div>
      </div>

      <!-- Portfolio Overview -->
      <MaintenanceWrapper
        isUnderMaintenance={true}
        disableContent={true}
        message="Portfolio overview is currently under maintenance. We're working on improving this feature."
        variant="default"
        showIcon={true}
      >
        <PortfolioOverview />
      </MaintenanceWrapper>

      <!-- Recent Transactions -->
      <RecentTransactions
        transactions={recentTx}
        isLoading={isLoadingTransactions}
      />
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

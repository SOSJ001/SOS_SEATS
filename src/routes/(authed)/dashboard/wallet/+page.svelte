<script lang="ts">
  import WalletBalance from "$lib/components/WalletBalance.svelte";
  import PortfolioOverview from "$lib/components/PortfolioOverview.svelte";
  import RecentTransactions from "$lib/components/RecentTransactions.svelte";
  import NetworkStatus from "$lib/components/NetworkStatus.svelte";
  import { onMount } from "svelte";
  import { sessionFromDb, showToast } from "$lib/store";
  import MaintenanceWrapper from "$lib/components/MaintenanceWrapper.svelte";
  import {
    calculateWithdrawalFee,
    formatPlatformFeePercent,
    formatWithdrawalMonimeFeePercent,
  } from "$lib/fees";
  import PendingWithdrawalCard from "$lib/components/PendingWithdrawalCard.svelte";
  import {
    walletDataGet,
    getWithdrawable,
    requestWithdrawal,
    syncPayouts,
  } from "$lib/client/walletData";

  export const data = undefined;

  // Animation states
  let isLoaded = false;
  let showContent = false;

  // Balances (the withdrawable balance is computed on the server)
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
  let isWithdrawing = false;
  let pendingWithdrawals: any[] = [];
  let isLoadingPendingWithdrawals = true;

  // Withdrawal modal state
  let showWithdrawalModal = false;
  let withdrawalPhoneNumber = "";
  let withdrawalProvider: "orange_money" | "afrimoney" = "orange_money";

  // Fee preview; the server recomputes these when the withdrawal is made
  $: withdrawalFeeDetails = calculateWithdrawalFee(mobileMoneyTotal);
  $: withdrawalPlatformFee = withdrawalFeeDetails.platformFee;
  $: estimatedMonimeFee = withdrawalFeeDetails.monimeFee;
  $: withdrawalNetAmount = withdrawalFeeDetails.netAmount;

  const formatMoney = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  function openWithdrawalModal() {
    showWithdrawalModal = true;
    withdrawalPhoneNumber = "";
    withdrawalProvider = "orange_money";
  }

  function closeWithdrawalModal() {
    showWithdrawalModal = false;
    withdrawalPhoneNumber = "";
  }

  async function refreshWalletData() {
    await Promise.all([
      loadMobileMoneyTotal(),
      loadRecentTransactions(),
      loadPendingWithdrawals(),
    ]);
  }

  async function handleWithdrawMobileMoney() {
    if (mobileMoneyTotal <= 0 || isWithdrawing) return;

    if (!$sessionFromDb) {
      showToast("error", "Login Required", "Please log in to withdraw.", 5000);
      return;
    }

    const phone = withdrawalPhoneNumber.trim();
    if (!phone) {
      showToast(
        "error",
        "Phone Number Required",
        "Please enter your mobile money phone number.",
        5000
      );
      return;
    }

    isWithdrawing = true;
    try {
      const result = await requestWithdrawal({
        phone,
        provider: withdrawalProvider,
      });

      if (!result?.success) {
        showToast(
          "error",
          "Withdrawal Failed",
          result?.error || "Failed to process withdrawal. Please try again.",
          8000
        );
        return;
      }

      const w = result.data;
      closeWithdrawalModal();
      const feesInfo =
        w.platformFee > 0 || w.monimeFee > 0
          ? ` (Platform Fee: ${w.platformFee.toFixed(2)}, Monime Fee: ${w.monimeFee.toFixed(2)})`
          : "";

      if (w.status === "completed") {
        showToast(
          "success",
          "Withdrawal Successful",
          `${w.currency} ${w.netAmount.toFixed(2)} has been sent to ${w.phone}.${feesInfo}`,
          8000
        );
      } else {
        showToast(
          "info",
          "Withdrawal Submitted",
          `Status: ${w.payoutStatus || w.status}. Amount to receive: ${w.currency} ${w.netAmount.toFixed(2)}${feesInfo}`,
          10000
        );
      }

      await refreshWalletData();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      showToast(
        "error",
        "Withdrawal Failed",
        error?.message || "Failed to process withdrawal. Please try again.",
        8000
      );
    } finally {
      isWithdrawing = false;
    }
  }

  async function loadMobileMoneyTotal() {
    isLoadingMobileMoney = true;
    try {
      const result = await getWithdrawable();
      mobileMoneyTotal = result?.success ? Number(result.data?.available) || 0 : 0;
    } catch (err) {
      console.error("Error loading withdrawable balance:", err);
      mobileMoneyTotal = 0;
    } finally {
      isLoadingMobileMoney = false;
    }
  }

  const sumOrders = (rows: any[], method: string) =>
    rows
      .filter((r: any) => r.payment_method === method)
      .reduce((sum: number, r: any) => {
        const amt =
          typeof r.total_amount === "string"
            ? parseFloat(r.total_amount)
            : r.total_amount || 0;
        return sum + (isFinite(amt) ? amt : 0);
      }, 0);

  async function loadOrderTotals() {
    isLoadingSolana = true;
    isLoadingTotal = true;
    try {
      const result = await walletDataGet("organizer-orders", {
        payment_statuses: "paid,completed",
      });
      const rows = result?.success ? result.data || [] : [];
      if (!result?.success) {
        console.error("Error loading order totals:", result?.error);
      }
      solanaOrdersTotal = sumOrders(rows, "solana");
      totalRevenue =
        solanaOrdersTotal + sumOrders(rows, "orange_money") + sumOrders(rows, "afrimoney");
    } catch (err) {
      console.error("Error in loadOrderTotals:", err);
      totalRevenue = solanaOrdersTotal + mobileMoneyTotal;
    } finally {
      totalDisplay = formatMoney(totalRevenue);
      isLoadingSolana = false;
      isLoadingTotal = false;
    }
  }

  const isMobileMoney = (method: string) =>
    method === "orange_money" || method === "afrimoney" || method === "mobile_money";

  async function loadRecentTransactions() {
    isLoadingTransactions = true;
    try {
      const [ordersResult, ledgerResult] = await Promise.all([
        walletDataGet("organizer-orders", {
          payment_statuses: "paid,completed",
          limit: 10,
        }),
        walletDataGet("transactions", { limit: 10 }),
      ]);

      const fromOrders = (ordersResult?.success ? ordersResult.data || [] : []).map(
        (o: any) => {
          const mm = isMobileMoney(o.payment_method);
          return {
            id: o.id,
            type: o.payment_method,
            description: `${mm ? "Mobile Money" : "Web3"}: ${o.events?.name || "Event"} #${o.order_number}`,
            date: new Date(o.created_at).toLocaleString(),
            amount: `+ ${Number(o.total_amount || 0).toFixed(2)} ${mm ? "NLe" : o.currency || ""}`.trim(),
            status: o.payment_status || "completed",
            icon: mm ? "deposit" : "ticket",
            transactionType: "order",
          };
        }
      );

      const fromLedger = (ledgerResult?.success ? ledgerResult.data || [] : []).map(
        (t: any) => ({
          id: t.id,
          type: t.type,
          description: `${t.type === "withdrawal" ? "Withdrawal" : t.type === "deposit" ? "Deposit" : t.type}: ${t.source}`,
          date: new Date(t.created_at).toLocaleString(),
          amount: `${t.amount >= 0 ? "+ " : ""}${Number(t.amount || 0).toFixed(2)} ${isMobileMoney(t.source) ? "NLe" : t.currency || ""}`.trim(),
          status: t.status || "pending",
          icon:
            t.type === "withdrawal"
              ? "withdrawal"
              : t.type === "deposit"
                ? "deposit"
                : "ticket",
          source: t.source,
          external_id: t.external_id,
          transactionType: "wallet_transaction",
        })
      );

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

  async function loadPendingWithdrawals() {
    isLoadingPendingWithdrawals = true;
    try {
      const result = await walletDataGet("transactions", {
        type: "withdrawal",
        status: "pending",
        limit: 20,
      });
      pendingWithdrawals = result?.success ? result.data || [] : [];
    } catch (err) {
      console.error("Error in loadPendingWithdrawals:", err);
      pendingWithdrawals = [];
    } finally {
      isLoadingPendingWithdrawals = false;
    }
  }

  function handleEscapeKey(e: KeyboardEvent) {
    if (e.key === "Escape" && showWithdrawalModal) {
      closeWithdrawalModal();
    }
  }

  onMount(() => {
    setTimeout(() => {
      isLoaded = true;
    }, 100);
    setTimeout(() => {
      showContent = true;
    }, 300);

    window.addEventListener("keydown", handleEscapeKey);

    (async () => {
      await Promise.all([
        loadMobileMoneyTotal(),
        loadOrderTotals(),
        loadRecentTransactions(),
        loadPendingWithdrawals(),
      ]);

      // Pick up payouts that finished since the last visit
      const synced = await syncPayouts().catch(() => null);
      if (synced?.success && synced.data?.updated > 0) {
        await refreshWalletData();
      }
    })();

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
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
        balance={isLoadingMobileMoney ? "--" : `NLe ${mobileMoneyTotal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        isLoading={isLoadingMobileMoney}
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
              NLe {mobileMoneyTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          {/if}
          <div class="text-xs text-gray-500 mt-1">
            All completed mobile money orders
          </div>
          <div class="pt-1">
            <button
              on:click={openWithdrawalModal}
              disabled={mobileMoneyTotal <= 0 ||
                isLoadingMobileMoney ||
                isWithdrawing}
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                {mobileMoneyTotal > 0 && !isLoadingMobileMoney && !isWithdrawing
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}"
            >
              {isWithdrawing ? "Processing..." : "Withdraw"}
            </button>
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

      <!-- Pending Withdrawals -->
      {#if pendingWithdrawals.length > 0}
        <div class="space-y-4">
          <h2 class="text-lg sm:text-xl font-bold text-white">
            Pending Withdrawals
          </h2>
          <div class="space-y-3">
            {#each pendingWithdrawals as withdrawal (withdrawal.id)}
              <PendingWithdrawalCard
                {withdrawal}
                onRefresh={refreshWalletData}
              />
            {/each}
          </div>
        </div>
      {/if}

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

  <!-- Withdrawal Modal -->
  {#if showWithdrawalModal}
    <!-- Modal Backdrop - click outside to close -->
    <button
      type="button"
      class="fixed inset-0 bg-black/70 z-50 p-2 sm:p-4 border-none cursor-default"
      on:click={closeWithdrawalModal}
      aria-label="Close modal"
    ></button>
    <!-- Modal Content -->
    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 pointer-events-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdrawal-modal-title"
    >
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl pointer-events-auto my-auto max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
      >
        <div
          class="flex items-center justify-between mb-4 sticky top-0 bg-gray-800 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-0 pb-2 border-b border-gray-700"
        >
          <h3
            id="withdrawal-modal-title"
            class="text-lg sm:text-xl font-bold text-white"
          >
            Withdraw Mobile Money
          </h3>
          <button
            on:click={closeWithdrawalModal}
            class="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Amount Display -->
          <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div>
              <div class="text-sm text-gray-400 mb-1">Withdrawal Amount</div>
              <div class="text-2xl font-bold text-white">
                NLe {mobileMoneyTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div class="border-t border-gray-600 pt-2 space-y-2">
              <!-- Platform Fee (5%) -->
              {#if withdrawalPlatformFee > 0}
                <div
                  class="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>Platform Fee ({formatPlatformFeePercent()}):</span>
                  <span
                    >-NLe {withdrawalPlatformFee.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              {/if}

              <!-- Monime Processing Fee (1%) -->
              {#if estimatedMonimeFee > 0}
                <div
                  class="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>Processing Fee ({formatWithdrawalMonimeFeePercent()}):</span>
                  <span
                    >-NLe {estimatedMonimeFee.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              {/if}

              <!-- Total Fees -->
              {#if withdrawalPlatformFee > 0 || estimatedMonimeFee > 0}
                <div
                  class="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-700"
                >
                  <span>Total Fees:</span>
                  <span
                    >-NLe {(
                      withdrawalPlatformFee + estimatedMonimeFee
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              {/if}

              <!-- Net Amount -->
              <div
                class="flex items-center justify-between text-sm text-gray-300 pt-2 border-t border-gray-600"
              >
                <span class="font-medium">Amount You'll Receive:</span>
                <span class="font-bold text-cyan-400"
                  >NLe {withdrawalNetAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span
                >
              </div>
            </div>
          </div>

          <!-- Provider Selection -->
          <div>
            <div class="block text-sm font-medium text-gray-300 mb-2">
              Mobile Money Provider
            </div>
            <div
              class="grid grid-cols-2 gap-3"
              role="group"
              aria-label="Mobile Money Provider"
            >
              <button
                on:click={() => (withdrawalProvider = "orange_money")}
                class="px-4 py-3 rounded-lg border-2 transition-colors text-sm font-semibold
                  {withdrawalProvider === 'orange_money'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'}"
              >
                Orange Money
              </button>
              <button
                on:click={() => (withdrawalProvider = "afrimoney")}
                class="px-4 py-3 rounded-lg border-2 transition-colors text-sm font-semibold
                  {withdrawalProvider === 'afrimoney'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'}"
              >
                Afrimoney
              </button>
            </div>
          </div>

          <!-- Phone Number Input -->
          <div>
            <label
              for="withdrawal-phone"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              Phone Number
            </label>
            <input
              id="withdrawal-phone"
              type="tel"
              bind:value={withdrawalPhoneNumber}
              placeholder="+23278000000"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              disabled={isWithdrawing}
            />
            <p class="text-xs text-gray-400 mt-1">
              Include country code (e.g., +232 for Sierra Leone)
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 sm:gap-3 pt-2">
            <button
              on:click={closeWithdrawalModal}
              disabled={isWithdrawing}
              class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              on:click={handleWithdrawMobileMoney}
              disabled={isWithdrawing || !withdrawalPhoneNumber.trim()}
              class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg text-sm sm:text-base font-semibold hover:from-cyan-600 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isWithdrawing}
                <span class="flex items-center justify-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5"
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
                  Processing...
                </span>
              {:else}
                Confirm Withdrawal
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

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

<script lang="ts">
  import WalletBalance from "$lib/components/WalletBalance.svelte";
  import PortfolioOverview from "$lib/components/PortfolioOverview.svelte";
  import RecentTransactions from "$lib/components/RecentTransactions.svelte";
  import NetworkStatus from "$lib/components/NetworkStatus.svelte";
  import { onMount, onDestroy } from "svelte";
  import { supabase, verifyWeb3Session, loadUserEvents } from "$lib/supabase";
  import { getBalance, getActiveWalletAddress } from "$lib/web3";
  import { sessionFromDb } from "$lib/store";
  import MaintenanceWrapper from "$lib/components/MaintenanceWrapper.svelte";
  import { monimeService } from "$lib/monime";
  import { calculateWithdrawalFee } from "$lib/orangeMoneyPayment";

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
  let isWithdrawing = false;

  // Withdrawal modal state
  let showWithdrawalModal = false;
  let withdrawalPhoneNumber = "";
  let withdrawalProvider: "orange_money" | "afrimoney" = "orange_money";

  // Calculated withdrawal fees (reactive)
  $: withdrawalFeeDetails = calculateWithdrawalFee(mobileMoneyTotal);
  $: withdrawalPlatformFee = withdrawalFeeDetails.platformFee;
  $: withdrawalNetAfterPlatformFee = withdrawalFeeDetails.netAmount;
  // Estimated Monime processing fee (1% of amount after platform fee)
  $: estimatedMonimeFee = withdrawalNetAfterPlatformFee * 0.01;
  // Final net amount user will receive (after platform fee and estimated Monime fee)
  $: withdrawalNetAmount = withdrawalNetAfterPlatformFee - estimatedMonimeFee;

  function openWithdrawalModal() {
    showWithdrawalModal = true;
    withdrawalPhoneNumber = "";
    withdrawalProvider = "orange_money";
  }

  function closeWithdrawalModal() {
    showWithdrawalModal = false;
    withdrawalPhoneNumber = "";
  }

  async function handleWithdrawMobileMoney() {
    if (mobileMoneyTotal <= 0 || isWithdrawing) return;

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

    // Validate phone number
    const phoneNumber = withdrawalPhoneNumber.trim();
    if (!phoneNumber) {
      alert("Please enter your mobile money phone number.");
      return;
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    isWithdrawing = true;

    try {
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

      // Calculate withdrawal fees
      const feeDetails = calculateWithdrawalFee(mobileMoneyTotal);
      const platformFee = feeDetails.platformFee;
      const netAmount = feeDetails.netAmount;

      // Validate net amount is sufficient
      if (netAmount <= 0) {
        alert(
          "Withdrawal amount is too small after fees. Please try a larger amount."
        );
        isWithdrawing = false;
        return;
      }

      // Map provider to Monime provider code
      const providerCode =
        withdrawalProvider === "orange_money" ? "m17" : "m18";

      // Create payout via Monime API (send net amount after platform fee)
      const payout = await monimeService.createPayout(
        {
          currency: currency,
          value: netAmount, // Send net amount (after platform fee)
        },
        {
          providerCode: providerCode,
          accountId: formattedPhone,
        },
        undefined, // source (optional)
        {
          wallet_address: wallet,
          user_id: userId,
          withdrawal_type: "mobile_money",
          gross_amount: mobileMoneyTotal,
          platform_fee: platformFee,
          net_amount: netAmount,
        },
        `withdrawal_${Date.now()}_${wallet}`
      );

      // Calculate total fees (platform fee + Monime fees)
      const monimeFees =
        payout.fees?.reduce((sum: number, fee: any) => {
          const feeValue =
            typeof fee.amount?.value === "number"
              ? fee.amount.value / 100 // Convert from cents
              : parseFloat(fee.amount?.value || 0) / 100;
          return sum + feeValue;
        }, 0) || 0;

      // Create withdrawal record in wallet_transactions with payout details
      const { error } = await supabase.from("wallet_transactions").insert([
        {
          wallet_address: wallet,
          type: "withdrawal",
          source: "mobile_money",
          amount: -Number(mobileMoneyTotal || 0), // Deduct full amount from balance
          currency: currency,
          status: payout.status === "completed" ? "completed" : "pending",
          external_id: payout.id,
          metadata: {
            note: "User-initiated withdrawal from wallet page",
            payout_id: payout.id,
            payout_status: payout.status,
            provider: withdrawalProvider,
            phone_number: formattedPhone,
            gross_amount: mobileMoneyTotal,
            platform_fee: platformFee,
            monime_fees: monimeFees,
            net_amount: netAmount,
            fees_breakdown: {
              platform_fee: platformFee,
              monime_fees: monimeFees,
              total_fees: platformFee + monimeFees,
            },
            monime_response: payout,
          },
        },
      ]);

      if (error) {
        console.error("Error creating withdrawal record:", error);
        alert(
          "Withdrawal initiated but failed to save record. Please contact support."
        );
        return;
      }

      // Close modal and refresh
      closeWithdrawalModal();
      const feesInfo =
        platformFee > 0 || monimeFees > 0
          ? ` (Fees: ${(platformFee + monimeFees).toFixed(2)})`
          : "";
      alert(
        payout.status === "completed"
          ? `Withdrawal successful! ${currency} ${netAmount.toFixed(2)} has been sent to ${formattedPhone}.${feesInfo}`
          : `Withdrawal submitted! Status: ${payout.status}. You'll be notified when it completes. Amount to receive: ${currency} ${netAmount.toFixed(2)}${feesInfo}`
      );

      // Refresh balances and transactions
      await loadMobileMoneyTotal();
      await loadRecentTransactions();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      const errorMessage =
        error.message || "Failed to process withdrawal. Please try again.";
      alert(errorMessage);
    } finally {
      isWithdrawing = false;
    }
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

  // Handle Escape key to close modal
  function handleEscapeKey(e: KeyboardEvent) {
    if (e.key === "Escape" && showWithdrawalModal) {
      closeWithdrawalModal();
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

    // Add Escape key listener for modal
    window.addEventListener("keydown", handleEscapeKey);

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

    // Cleanup on destroy
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
      class="fixed inset-0 bg-black/70 z-50 p-4 border-none cursor-default"
      on:click={closeWithdrawalModal}
      aria-label="Close modal"
    ></button>
    <!-- Modal Content -->
    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdrawal-modal-title"
    >
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-xl pointer-events-auto"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 id="withdrawal-modal-title" class="text-xl font-bold text-white">
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
                {mobileMoneyTotal.toLocaleString(undefined, {
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
                  <span>Platform Fee (5%):</span>
                  <span
                    >-{withdrawalPlatformFee.toLocaleString(undefined, {
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
                  <span>Processing Fee (1%):</span>
                  <span
                    >-{estimatedMonimeFee.toLocaleString(undefined, {
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
                    >-{(
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
                  >{withdrawalNetAmount.toLocaleString(undefined, {
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
          <div class="flex gap-3 pt-2">
            <button
              on:click={closeWithdrawalModal}
              disabled={isWithdrawing}
              class="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              on:click={handleWithdrawMobileMoney}
              disabled={isWithdrawing || !withdrawalPhoneNumber.trim()}
              class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

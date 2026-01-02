<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress } from "$lib/web3";
  import { showToast } from "$lib/store";
  import { monimeService } from "$lib/monime";

  let transaction: any = null;
  let loading = true;
  let error: string | null = null;
  let payoutStatus: any = null;
  let loadingPayoutStatus = false;

  $: transactionId = $page.params.id;

  async function loadTransaction() {
    if (!transactionId) {
      error = "Transaction ID is required";
      loading = false;
      return;
    }

    try {
      // Get wallet address
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }

      if (!wallet) {
        error = "Wallet not found";
        loading = false;
        return;
      }

      // Fetch transaction
      const { data, error: fetchError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("wallet_address", wallet)
        .single();

      if (fetchError || !data) {
        error = "Transaction not found";
        loading = false;
        return;
      }

      transaction = data;

      // If it's a withdrawal with external_id, try to fetch payout status
      if (
        transaction.type === "withdrawal" &&
        transaction.external_id &&
        (transaction.status === "pending" ||
          transaction.status === "completed" ||
          transaction.status === "paid")
      ) {
        await loadPayoutStatus();
      }
    } catch (err: any) {
      error = err.message || "Failed to load transaction";
    } finally {
      loading = false;
    }
  }

  async function loadPayoutStatus() {
    if (!transaction?.external_id) return;

    loadingPayoutStatus = true;
    try {
      const status = await monimeService.getPayoutStatus(transaction.external_id);
      payoutStatus = status;
    } catch (err: any) {
      // Silently fail - payout status is optional
    } finally {
      loadingPayoutStatus = false;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function formatCurrency(amount: number, currency: string = "NLe") {
    return `${amount >= 0 ? "+" : ""}${amount.toFixed(2)} ${currency}`;
  }

  function getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-500 text-white";
      case "pending":
      case "pending_approval":
        return "bg-yellow-400 text-black";
      case "failed":
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  }

  onMount(() => {
    loadTransaction();
  });
</script>

<div class="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <button
        on:click={() => goto("/dashboard/wallet")}
        class="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2 text-sm sm:text-base"
      >
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Wallet
      </button>
      <h1 class="text-2xl sm:text-3xl font-bold">Transaction Details</h1>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <svg
          class="animate-spin h-8 w-8 text-cyan-400"
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
      </div>
    {:else if error}
      <div class="bg-red-500/10 border border-red-500 rounded-lg p-4">
        <p class="text-red-400">{error}</p>
      </div>
    {:else if transaction}
      <!-- Transaction Card -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <!-- Header Row -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-2">
              {transaction.type === "withdrawal"
                ? "Withdrawal"
                : transaction.type === "deposit"
                  ? "Deposit"
                  : transaction.type}
            </h2>
            <p class="text-gray-400 text-sm sm:text-base">
              {formatDate(transaction.created_at)}
            </p>
          </div>
          <div class="flex flex-col sm:items-end gap-2">
            <span
              class="text-2xl sm:text-3xl font-bold {transaction.amount >= 0
                ? "text-green-400"
                : "text-red-400"}"
            >
              {formatCurrency(transaction.amount, transaction.currency || "NLe")}
            </span>
            <span
              class="px-3 py-1 text-xs sm:text-sm font-medium rounded-full {getStatusClass(
                transaction.status
              )} inline-block"
            >
              {transaction.status?.toUpperCase() || "UNKNOWN"}
            </span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p class="text-gray-400 text-sm mb-1">Transaction ID</p>
            <p class="text-white font-mono text-sm break-all">{transaction.id}</p>
          </div>

          <div>
            <p class="text-gray-400 text-sm mb-1">Type</p>
            <p class="text-white capitalize">{transaction.type}</p>
          </div>

          <div>
            <p class="text-gray-400 text-sm mb-1">Source</p>
            <p class="text-white capitalize">
              {transaction.source || "N/A"}
            </p>
          </div>

          <div>
            <p class="text-gray-400 text-sm mb-1">Currency</p>
            <p class="text-white">{transaction.currency || "NLe"}</p>
          </div>

          {#if transaction.external_id}
            <div class="sm:col-span-2">
              <p class="text-gray-400 text-sm mb-1">External Transaction ID</p>
              <p class="text-white font-mono text-sm break-all">
                {transaction.external_id}
              </p>
            </div>
          {/if}

          {#if transaction.metadata?.phone_number}
            <div>
              <p class="text-gray-400 text-sm mb-1">Phone Number</p>
              <p class="text-white">{transaction.metadata.phone_number}</p>
            </div>
          {/if}

          {#if transaction.metadata?.provider}
            <div>
              <p class="text-gray-400 text-sm mb-1">Provider</p>
              <p class="text-white capitalize">
                {transaction.metadata.provider.replace("_", " ")}
              </p>
            </div>
          {/if}

          {#if transaction.metadata?.transaction_reference}
            <div class="sm:col-span-2">
              <p class="text-gray-400 text-sm mb-1">Transaction Reference</p>
              <p class="text-white font-mono text-sm break-all">
                {transaction.metadata.transaction_reference}
              </p>
            </div>
          {/if}
        </div>

        <!-- Fees Breakdown (for withdrawals) -->
        {#if transaction.type === "withdrawal" && transaction.metadata}
          <div class="mt-6 pt-6 border-t border-gray-700">
            <h3 class="text-lg font-semibold mb-4">Fees Breakdown</h3>
            <div class="space-y-2">
              {#if transaction.metadata.gross_amount}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Gross Amount</span>
                  <span class="text-white">
                    {transaction.currency || "NLe"} {Number(
                      transaction.metadata.gross_amount
                    ).toFixed(2)}
                  </span>
                </div>
              {/if}
              {#if transaction.metadata.platform_fee}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Platform Fee</span>
                  <span class="text-white">
                    {transaction.currency || "NLe"} {Number(
                      transaction.metadata.platform_fee
                    ).toFixed(2)}
                  </span>
                </div>
              {/if}
              {#if transaction.metadata.actual_monime_fee !== undefined ||
                transaction.metadata.estimated_monime_fee !== undefined}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Processing Fee</span>
                  <span class="text-white">
                    {transaction.currency || "NLe"}{" "}
                    {Number(
                      transaction.metadata.actual_monime_fee ||
                        transaction.metadata.estimated_monime_fee ||
                        0
                    ).toFixed(2)}
                  </span>
                </div>
              {/if}
              {#if transaction.metadata.final_net_amount}
                <div class="flex justify-between text-sm font-semibold pt-2 border-t border-gray-700">
                  <span class="text-gray-300">Net Amount</span>
                  <span class="text-white">
                    {transaction.currency || "NLe"} {Number(
                      transaction.metadata.final_net_amount
                    ).toFixed(2)}
                  </span>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Monime Payout Status (for withdrawals with external_id) -->
        {#if
          transaction.type === "withdrawal" &&
          transaction.external_id &&
          payoutStatus}
          <div class="mt-6 pt-6 border-t border-gray-700">
            <h3 class="text-lg font-semibold mb-4">Monime Payout Status</h3>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-400">Status</span>
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full {getStatusClass(
                    payoutStatus.status
                  )}"
                >
                  {payoutStatus.status?.toUpperCase()}
                </span>
              </div>
              {#if payoutStatus.destination?.transactionReference}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Transaction Reference</span>
                  <span class="text-white font-mono text-xs break-all">
                    {payoutStatus.destination.transactionReference}
                  </span>
                </div>
              {/if}
              {#if payoutStatus.destination?.phoneNumber}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-400">Phone Number</span>
                  <span class="text-white">{payoutStatus.destination.phoneNumber}</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>


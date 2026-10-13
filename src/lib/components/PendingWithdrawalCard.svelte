<script lang="ts">
  import { Loader2, RefreshCw } from "lucide-svelte";
  import { showToast } from "$lib/store";
  import { syncPayouts } from "$lib/client/walletData";

  export let withdrawal: any;
  /** Reload balances and lists after a status check. */
  export let onRefresh: (() => Promise<void>) | null = null;

  let isRefreshing = false;

  $: metadata = withdrawal?.metadata || {};
  $: phoneNumber = metadata.phone_number || "N/A";
  $: provider = String(metadata.provider || "orange_money").replace("_", " ");
  $: finalAmount = Number(metadata.final_net_amount || Math.abs(withdrawal?.amount || 0));
  $: currency = withdrawal?.currency || "NLe";

  async function handleRefreshStatus() {
    isRefreshing = true;
    try {
      const result = await syncPayouts();
      if (!result?.success) {
        showToast("error", "Check Failed", result?.error || "Could not check the payout.", 5000);
        return;
      }
      if (result.data?.updated > 0) {
        showToast("success", "Status Updated", "Your withdrawal status has been updated.", 5000);
      } else {
        showToast("info", "Status Checked", "The payout is still being processed.", 3000);
      }
      if (onRefresh) await onRefresh();
    } finally {
      isRefreshing = false;
    }
  }
</script>

<div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
    <div class="flex-1">
      <h3 class="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">Pending Withdrawal</h3>
      <p class="text-gray-400 text-xs sm:text-sm font-mono mb-1">{currency} {finalAmount.toFixed(2)}</p>
      <p class="text-gray-400 text-xs sm:text-sm">To: {phoneNumber}</p>
      <p class="text-gray-400 text-xs sm:text-sm capitalize">Provider: {provider}</p>
    </div>
    <span class="self-start px-2 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-xs sm:text-sm rounded">
      Pending
    </span>
  </div>

  {#if withdrawal?.external_id}
    <button
      type="button"
      on:click={handleRefreshStatus}
      disabled={isRefreshing}
      class="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {#if isRefreshing}
        <Loader2 class="size-4 animate-spin" />
        <span>Checking...</span>
      {:else}
        <RefreshCw class="size-4" />
        <span>Refresh Status</span>
      {/if}
    </button>
  {/if}
</div>

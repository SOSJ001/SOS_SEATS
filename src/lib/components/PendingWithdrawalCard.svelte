<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress } from "$lib/web3";
  import { showToast } from "$lib/store";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";

  import { monimeService } from "$lib/monime";

  export let withdrawal: any;
  export let onCancel: (() => Promise<void>) | null = null; // Callback to refresh after cancel
  export let onRefresh: (() => Promise<void>) | null = null; // Callback to refresh after status check

  let isCancelling = false;
  let isRefreshing = false;
  let currentWallet: string | null = null;
  let showCancelButton = false;
  let showCancelModal = false;

  function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  function formatCurrency(amount: number, currency: string): string {
    return `${currency} ${Math.abs(amount).toFixed(2)}`;
  }

  function getCollectedSignaturesCount(): number {
    if (!withdrawal.collected_signatures || !Array.isArray(withdrawal.collected_signatures)) {
      return 0;
    }
    return withdrawal.collected_signatures.length;
  }

  function getSignatureProgress(): number {
    const collected = getCollectedSignaturesCount();
    const required = withdrawal.required_signatures || 1;
    return Math.min((collected / required) * 100, 100);
  }

  async function getCurrentWallet(): Promise<string | null> {
    try {
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }
      return wallet;
    } catch (err) {
      return null;
    }
  }

  function isPrimaryWallet(): boolean {
    if (!currentWallet || !withdrawal) return false;
    return currentWallet === withdrawal.wallet_address;
  }

  function canCancel(): boolean {
    // Can cancel if:
    // 1. It's a multisig withdrawal (pending_approval) and user is primary wallet
    // 2. It's a standard pending withdrawal (pending) and user is the wallet owner
    if (!currentWallet || !withdrawal) return false;
    
    if (withdrawal.status === "pending_approval") {
      // Multisig withdrawal - only primary wallet can cancel
      return isPrimaryWallet();
    } else if (withdrawal.status === "pending") {
      // Standard pending withdrawal - wallet owner can cancel
      return currentWallet === withdrawal.wallet_address;
    }
    
    return false;
  }

  async function handleCancelClick() {
    if (!withdrawal?.id) return;

    // Get current wallet if not already set
    if (!currentWallet) {
      currentWallet = await getCurrentWallet();
    }

    if (!currentWallet) {
      showToast("error", "Wallet Not Found", "Please connect your wallet to cancel.", 5000);
      return;
    }

    // Check if user can cancel
    if (!canCancel()) {
      if (withdrawal.status === "pending_approval") {
        showToast(
          "error",
          "Not Authorized",
          "Only the primary wallet can cancel this withdrawal.",
          5000
        );
      } else {
        showToast(
          "error",
          "Not Authorized",
          "You can only cancel your own withdrawals.",
          5000
        );
      }
      return;
    }

    // Show confirmation modal
    showCancelModal = true;
  }

  function handleCancelConfirm() {
    showCancelModal = false;
    executeCancel();
  }

  function handleCancelModalCancel() {
    showCancelModal = false;
  }

  async function handleRefreshStatus() {
    if (!withdrawal.external_id) {
      showToast("info", "No Payout ID", "This withdrawal hasn't been executed yet.", 3000);
      return;
    }

    isRefreshing = true;
    try {
      // Check Monime status
      const payoutStatus = await monimeService.getPayoutStatus(withdrawal.external_id);

      // Map Monime statuses to our database statuses
      // Also check for transactionReference in destination - this indicates the transaction was completed by the mobile money provider
      let newStatus: string;
      const hasTransactionReference = payoutStatus.destination?.transactionReference;
      
      if (payoutStatus.status === "completed" || payoutStatus.status === "paid" || hasTransactionReference) {
        // Transaction is completed if:
        // 1. Payout status is "completed" or "paid"
        // 2. OR destination has a transactionReference (means mobile money provider processed it)
        newStatus = "completed";
      } else if (payoutStatus.status === "failed" || payoutStatus.status === "cancelled") {
        newStatus = "failed";
      } else {
        newStatus = withdrawal.status; // Keep current status
      }

      const statusChanged = newStatus !== withdrawal.status;

      // Update withdrawal status using RPC
      // Store transaction reference for tracking
      const updatedMetadata = {
        ...(withdrawal.metadata || {}),
        payout_status: payoutStatus.status,
        last_status_check: new Date().toISOString(),
        transaction_reference: payoutStatus.destination?.transactionReference || null,
        monime_response: payoutStatus,
      };

      const { data: updateResult, error: updateError } = await supabase.rpc("update_withdrawal_status", {
        p_withdrawal_id: withdrawal.id,
        p_status: newStatus,
        p_external_id: withdrawal.external_id,
        p_metadata: updatedMetadata,
      });

      if (updateError) {
        console.error("Failed to update withdrawal status:", updateError);
        showToast("error", "Update Failed", updateError.message || "Failed to update withdrawal status. Please try again.", 5000);
      } else {
        // Update local withdrawal object to trigger reactivity
        withdrawal = {
          ...withdrawal,
          status: newStatus,
          metadata: updatedMetadata,
        };
        
        if (statusChanged) {
          showToast("success", "Status Updated", `Withdrawal status updated to ${newStatus}.`, 5000);
        } else {
          showToast("info", "Status Checked", `Withdrawal is still ${payoutStatus.status} on Monime.`, 3000);
        }
        
        // Always refresh parent component to reload all data
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (err: any) {
      console.error("Error checking withdrawal status:", err);
      showToast("error", "Check Failed", err.message || "Failed to check withdrawal status.", 5000);
    } finally {
      isRefreshing = false;
    }
  }

  async function executeCancel() {
    if (!withdrawal?.id || !currentWallet) return;

    try {
      isCancelling = true;

      // Call API to cancel withdrawal
      const response = await fetch(`/api/wallet/cancel-pending-withdrawal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawal_id: withdrawal.id,
          wallet_address: currentWallet,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast(
          "error",
          "Error",
          result.message || "Failed to cancel withdrawal.",
          6000
        );
        isCancelling = false;
        return;
      }

      showToast(
        "success",
        "Withdrawal Cancelled",
        result.message || "Withdrawal has been cancelled successfully.",
        6000
      );

      // Immediately remove from UI by updating withdrawal status locally
      // This provides instant feedback while the refresh happens
      if (withdrawal) {
        withdrawal.status = "cancelled";
      }

      // Call refresh callback if provided
      if (onCancel) {
        await onCancel();
      }
    } catch (err: any) {
      showToast(
        "error",
        "Error",
        err.message || "Failed to cancel withdrawal.",
        6000
      );
    } finally {
      isCancelling = false;
    }
  }

  function handleViewDetails() {
    if (withdrawal.pending_token) {
      goto(`/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`);
    }
  }

  // Get wallet on mount and retry if needed
  onMount(async () => {
    currentWallet = await getCurrentWallet();
    
    // Retry wallet detection if not found initially (important for mobile)
    if (!currentWallet) {
      const retryDelays = [500, 1000, 2000];
      for (const delay of retryDelays) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        currentWallet = await getCurrentWallet();
        if (currentWallet) break;
      }
    }
  });

  // Reactive check for cancel button visibility
  $: {
    if (withdrawal && currentWallet) {
      if (withdrawal.status === "pending_approval") {
        // Multisig withdrawal - only primary wallet can cancel
        showCancelButton = currentWallet === withdrawal.wallet_address;
      } else if (withdrawal.status === "pending") {
        // Standard pending withdrawal - wallet owner can cancel
        showCancelButton = currentWallet === withdrawal.wallet_address;
      } else {
        showCancelButton = false;
      }
    } else {
      showCancelButton = false;
    }
  }

  function getTimeRemaining(): string {
    if (!withdrawal.expires_at) return "No expiry";
    const expires = new Date(withdrawal.expires_at);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  }

  // Don't render if withdrawal is cancelled
  $: isCancelled = withdrawal?.status === "cancelled";

  const metadata = withdrawal.metadata || {};
  const phoneNumber = metadata.phone_number || "N/A";
  const provider = metadata.provider || "orange_money";
  const finalAmount = metadata.final_net_amount || Math.abs(withdrawal.amount);
  const currency = withdrawal.currency || "NLe";
  const progress = getSignatureProgress();
  const collectedCount = getCollectedSignaturesCount();
  const requiredCount = withdrawal.required_signatures || 1;
  const remainingCount = Math.max(0, requiredCount - collectedCount);
</script>

{#if !isCancelled}
<div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5 hover:border-purple-500 transition-colors">
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
    <div class="flex-1">
      <h3 class="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">Pending Withdrawal</h3>
      <p class="text-gray-400 text-xs sm:text-sm font-mono mb-1">{formatCurrency(finalAmount, currency)}</p>
      <p class="text-gray-400 text-xs sm:text-sm">To: {phoneNumber}</p>
      <p class="text-gray-400 text-xs sm:text-sm capitalize">Provider: {provider.replace("_", " ")}</p>
    </div>
    <div class="text-right">
      {#if withdrawal.status === "pending_approval"}
        <span class="inline-block px-2 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-xs sm:text-sm rounded">
          Pending Approval
        </span>
      {:else if withdrawal.status === "pending"}
        <span class="inline-block px-2 py-1 bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-xs sm:text-sm rounded">
          Pending
        </span>
      {/if}
    </div>
  </div>

  <!-- Signature Progress (only for multisig withdrawals) -->
  {#if withdrawal.status === "pending_approval" && withdrawal.multisig_enabled}
    <div class="mb-3 sm:mb-4">
      <div class="flex items-center justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
        <span class="text-gray-400">Signatures</span>
        <span class="text-white font-semibold">{collectedCount} / {requiredCount}</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2 sm:h-2.5">
        <div
          class="bg-gradient-to-r from-purple-600 to-purple-700 h-2 sm:h-2.5 rounded-full transition-all duration-300"
          style="width: {progress}%"
        ></div>
      </div>
      {#if remainingCount > 0}
        <p class="text-gray-400 text-xs mt-1.5 sm:mt-2">Waiting for {remainingCount} more signature{remainingCount !== 1 ? 's' : ''}</p>
      {:else}
        <p class="text-green-400 text-xs mt-1.5 sm:mt-2">Ready to execute</p>
      {/if}
    </div>
  {/if}

  <!-- Time Remaining (only for multisig withdrawals with expiry) -->
  {#if withdrawal.status === "pending_approval" && withdrawal.expires_at}
    <div class="mb-3 sm:mb-4">
      <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>{getTimeRemaining()}</span>
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
    {#if withdrawal.status === "pending" || withdrawal.status === "pending_approval"}
      <button
        on:click={handleCancelClick}
        disabled={isCancelling || !showCancelButton}
        class="flex-1 px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        title={!showCancelButton && !currentWallet ? "Detecting wallet..." : !showCancelButton ? "Only the wallet owner can cancel this withdrawal" : ""}
      >
        {#if isCancelling}
          <svg class="animate-spin w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cancelling...</span>
        {:else}
          <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>Cancel</span>
        {/if}
      </button>
    {/if}
    {#if withdrawal.external_id && (withdrawal.status === "pending" || withdrawal.status === "pending_approval")}
      <button
        on:click={handleRefreshStatus}
        disabled={isRefreshing}
        class="flex-1 px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        title="Check current status from Monime"
      >
        {#if isRefreshing}
          <svg class="animate-spin w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Checking...</span>
        {:else}
          <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Refresh Status</span>
        {/if}
      </button>
    {/if}
    {#if withdrawal.pending_token}
      <button
        on:click={handleViewDetails}
        class="flex-1 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
      >
        <span>View Details</span>
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    {/if}
  </div>
</div>
{/if}

<!-- Cancel Confirmation Modal -->
<ConfirmationDialog
  bind:show={showCancelModal}
  title="Cancel Withdrawal"
  message={withdrawal.status === "pending_approval"
    ? "Are you sure you want to cancel this withdrawal? This action cannot be undone."
    : "Are you sure you want to cancel this pending withdrawal? The funds will remain in your balance."}
  confirmText={isCancelling ? "Cancelling..." : "Yes, Cancel"}
  cancelText="Keep Withdrawal"
  confirmVariant="danger"
  loading={isCancelling}
  on:confirm={handleCancelConfirm}
  on:cancel={handleCancelModalCancel}
/>


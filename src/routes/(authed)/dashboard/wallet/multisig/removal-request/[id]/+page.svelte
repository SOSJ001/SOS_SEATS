<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress, signMessageWithWallet } from "$lib/web3";
  import { showToast } from "$lib/store";
  import { goto } from "$app/navigation";

  export let data: any;

  let removalRequest = data.removalRequest;
  let isLoading = false;
  let isApproving = false;
  let currentWallet: string | null = null;

  // Get current wallet address
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
      console.error("Error getting wallet:", err);
      return null;
    }
  }

  onMount(async () => {
    currentWallet = await getCurrentWallet();
  });

  async function approveRemoval() {
    if (!removalRequest || !currentWallet) return;

    // Verify current wallet is the signer
    if (currentWallet !== removalRequest.signer_wallet_address) {
      showToast(
        "error",
        "Wrong Wallet",
        `Please connect the signer wallet (${removalRequest.signer_wallet_address.slice(0, 8)}...) to approve this removal.`,
        8000
      );
      return;
    }

    // Confirm approval
    if (!confirm(
      `Are you sure you want to approve your removal as a signer?\n\nPrimary Wallet: ${removalRequest.primary_wallet_address.slice(0, 8)}...${removalRequest.primary_wallet_address.slice(-6)}\n\nThis action cannot be undone.`
    )) {
      return;
    }

    try {
      isApproving = true;

      // Create message to sign
      const message = `I consent to my removal as a signer from multisig configuration for ${removalRequest.primary_wallet_address}\n\nRemoval Request ID: ${removalRequest.id}\nSigner Wallet: ${currentWallet}\nPrimary Wallet: ${removalRequest.primary_wallet_address}\nTimestamp: ${new Date().toISOString()}\n\nBy signing this message, I agree to be removed as a signer. All pending withdrawals requiring my signature have already been cancelled.`;

      // Sign message with wallet
      const signResult = await signMessageWithWallet(message);

      if (!signResult.success || !signResult.signature) {
        showToast(
          "error",
          "Signature Failed",
          signResult.error || "Failed to sign message. Please try again.",
          6000
        );
        isApproving = false;
        return;
      }

      // Convert signature to base64
      const signatureBase64 = Array.from(signResult.signature)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const signatureBase64Encoded = btoa(signatureBase64);

      // Call approve function
      const { data: result, error: rpcError } = await supabase.rpc("approve_multisig_removal", {
        p_removal_request_id: removalRequest.id,
        p_signer_wallet_address: currentWallet,
        p_signer_signature: signatureBase64Encoded,
      });

      if (rpcError) {
        console.error("Error approving removal:", rpcError);
        showToast("error", "Error", rpcError.message || "Failed to approve removal.");
        isApproving = false;
        return;
      }

      if (result && result.length > 0) {
        const response = result[0];
        if (response.success) {
          showToast(
            "success",
            "Removal Approved",
            response.message || "You have been successfully removed as a signer.",
            8000
          );

          // Redirect to wallet page after a moment
          setTimeout(() => {
            goto("/dashboard/wallet");
          }, 2000);
        } else {
          showToast("error", "Error", response.message || "Failed to approve removal.");
        }
      } else {
        showToast("error", "Error", "Failed to approve removal.");
      }
    } catch (err: any) {
      console.error("Error in approveRemoval:", err);
      showToast("error", "Error", err.message || "Failed to approve removal.");
    } finally {
      isApproving = false;
    }
  }

  function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleString();
  }
</script>

<svelte:head>
  <title>Multisig Removal Request - SOS SEATS</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white px-4 py-6 sm:py-8">
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6 sm:mb-8">
      <button
        on:click={() => goto("/dashboard/wallet")}
        class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm sm:text-base"
      >
        <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Back to Wallet
      </button>
      <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Multisig Removal Request</h1>
      <p class="text-gray-400 text-sm sm:text-base">Review and approve the request to remove you as a signer.</p>
    </div>

    {#if isLoading}
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
        <svg class="animate-spin h-12 w-12 text-purple-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-white text-sm sm:text-base">Loading...</p>
      </div>
    {:else if removalRequest}
      <!-- Removal Request Details -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 sm:p-6 mb-6">
        <h2 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Removal Request Details</h2>
        
        <div class="space-y-3 sm:space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <span class="text-gray-400 text-sm sm:text-base">Primary Wallet</span>
            <span class="text-white text-xs sm:text-sm font-mono">{formatAddress(removalRequest.primary_wallet_address)}</span>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <span class="text-gray-400 text-sm sm:text-base">Your Wallet (Signer)</span>
            <span class="text-white text-xs sm:text-sm font-mono">{formatAddress(removalRequest.signer_wallet_address)}</span>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <span class="text-gray-400 text-sm sm:text-base">Requested At</span>
            <span class="text-white text-sm sm:text-base">{formatDate(removalRequest.created_at)}</span>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <span class="text-gray-400 text-sm sm:text-base">Expires At</span>
            <span class="text-white text-sm sm:text-base">{formatDate(removalRequest.expires_at)}</span>
          </div>
        </div>
      </div>

      <!-- Important Notice -->
      <div class="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 sm:p-5 mb-6">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <div>
            <p class="text-yellow-400 text-sm sm:text-base font-semibold mb-2">Important Information</p>
            <ul class="text-yellow-300 text-xs sm:text-sm space-y-1 list-disc list-inside">
              <li>All pending withdrawals requiring your signature have been automatically cancelled.</li>
              <li>By approving this removal, you will no longer be able to sign withdrawals for this primary wallet.</li>
              <li>This action cannot be undone.</li>
              <li>You must be connected with the signer wallet to approve.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      {#if currentWallet}
        {#if currentWallet !== removalRequest.signer_wallet_address}
          <div class="bg-red-900/20 border border-red-700 rounded-xl p-4 sm:p-5 mb-6">
            <p class="text-red-400 text-sm sm:text-base">
              Wrong wallet connected. Please connect the signer wallet ({formatAddress(removalRequest.signer_wallet_address)}) to approve this removal.
            </p>
          </div>
        {:else}
          <button
            on:click={approveRemoval}
            disabled={isApproving}
            class="w-full px-4 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if isApproving}
              <svg class="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Approving...
            {:else}
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Approve Removal
            {/if}
          </button>
        {/if}
      {:else}
        <div class="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 sm:p-5 mb-6">
          <p class="text-yellow-400 text-sm sm:text-base">Please connect your wallet to approve this removal request.</p>
        </div>
      {/if}
    {:else}
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
        <p class="text-gray-400 text-sm sm:text-base">Removal request not found or already processed.</p>
      </div>
    {/if}
  </div>
</div>


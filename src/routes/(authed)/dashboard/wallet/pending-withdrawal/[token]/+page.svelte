<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress, signMessageWithWallet } from "$lib/web3";
  import { showToast } from "$lib/store";
  import type { PageData } from "./$types";

  export let data: PageData;

  let isLoading = false;
  let isSigning = false;
  let currentWallet: string | null = null;
  let hasAlreadySigned = false;
  let canSign = false;

  // Withdrawal data
  $: withdrawal = data.withdrawal;
  $: authorizedSigners = data.authorizedSigners || [];
  $: signatureCount = withdrawal.collected_signatures?.length || 0;
  $: remainingSignatures = withdrawal.required_signatures - signatureCount;
  $: isExpired = withdrawal.expires_at
    ? new Date(withdrawal.expires_at) < new Date()
    : false;
  $: timeRemaining = getTimeRemaining(withdrawal.expires_at);

  onMount(async () => {
    await checkWalletConnection();
  });

  async function checkWalletConnection() {
    try {
      const session = await verifyWeb3Session();
      currentWallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : getActiveWalletAddress();

      if (currentWallet) {
        // Check if wallet is authorized
        canSign = authorizedSigners.includes(currentWallet);

        // Check if already signed
        hasAlreadySigned = withdrawal.collected_signatures?.some(
          (sig: any) => sig.wallet === currentWallet
        );
      }
    } catch (err) {
      console.error("Error checking wallet:", err);
    }
  }

  function getTimeRemaining(expiresAt: string | null): string {
    if (!expiresAt) return "No expiry";
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";
    if (diff < 60 * 1000) return `${Math.floor(diff / 1000)}s remaining`;
    if (diff < 60 * 60 * 1000)
      return `${Math.floor(diff / (60 * 1000))}m remaining`;
    if (diff < 24 * 60 * 60 * 1000)
      return `${Math.floor(diff / (60 * 60 * 1000))}h remaining`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d remaining`;
  }

  function formatWalletAddress(address: string): string {
    if (!address) return "";
    if (address.length <= 12) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  async function signWithdrawal() {
    if (!currentWallet || !canSign || hasAlreadySigned || isExpired) {
      return;
    }

    try {
      isSigning = true;

      // Create signature message
      const signatureMessage = `Approve withdrawal: ${withdrawal.metadata?.phone_number || "N/A"} - ${Math.abs(withdrawal.amount)} ${withdrawal.currency || "NLe"}`;

      // Sign message with wallet
      const signResult = await signMessageWithWallet(signatureMessage);

      if (!signResult || !signResult.signature) {
        showToast("error", "Signature Failed", "Failed to sign withdrawal request.");
        return;
      }

      // Add signature to withdrawal
      const { data: result, error: sigError } = await supabase.rpc(
        "add_withdrawal_signature",
        {
          p_withdrawal_id: withdrawal.id,
          p_wallet_address: currentWallet,
          p_signature: signResult.signature,
          p_public_key: signResult.publicKey || currentWallet,
        }
      );

      if (sigError) {
        console.error("Error adding signature:", sigError);
        showToast("error", "Error", sigError.message || "Failed to add signature.");
        return;
      }

      if (result && result.length > 0) {
        const response = result[0];
          if (response.success) {
            if (response.threshold_met) {
              // Threshold met - execute withdrawal
              await executePendingWithdrawal();
            } else {
            showToast(
              "success",
              "Signature Added",
              response.message ||
                `Waiting for ${remainingSignatures - 1} more signature(s).`,
              3000
            );
            // Reload to show updated signature count
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } else {
          showToast("error", "Error", response.message || "Failed to add signature.");
        }
      }
    } catch (err: any) {
      console.error("Error signing withdrawal:", err);
      showToast(
        "error",
        "Error",
        err.message || "Failed to sign withdrawal request."
      );
    } finally {
      isSigning = false;
    }
  }

  async function executePendingWithdrawal() {
    try {
      isLoading = true;

      // Call API to execute pending withdrawal
      const response = await fetch(`/api/wallet/execute-pending-withdrawal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawal_id: withdrawal.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          "success",
          "Withdrawal Executed!",
          result.message ||
            "All signatures collected. Withdrawal has been executed successfully.",
          8000
        );
        // Reload page after a moment to see updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showToast(
          "error",
          "Execution Failed",
          result.message || "Failed to execute withdrawal. Please contact support.",
          8000
        );
      }
    } catch (err: any) {
      console.error("Error executing withdrawal:", err);
      showToast(
        "error",
        "Error",
        err.message || "Failed to execute withdrawal. Please try again."
      );
    } finally {
      isLoading = false;
    }
  }

  function goBack() {
    goto("/dashboard/wallet");
  }
</script>

<svelte:head>
  <title>Pending Withdrawal - SOS SEATS</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white px-4 py-6">
  <!-- Header -->
  <div class="mb-6">
    <button
      on:click={goBack}
      class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span class="text-sm">Back to Wallet</span>
    </button>
    <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
      Pending Withdrawal
    </h1>
    <p class="text-gray-400 text-sm md:text-base">
      Multi-signature withdrawal awaiting approvals
    </p>
  </div>

  <!-- Main Content -->
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Withdrawal Details Card -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div class="mb-6">
        <div class="text-sm text-gray-400 mb-1">Withdrawal Amount</div>
        <div class="text-3xl font-bold text-cyan-400">
          {Math.abs(withdrawal.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {withdrawal.currency || "NLe"}
        </div>
      </div>

      {#if withdrawal.metadata?.phone_number}
        <div class="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <div class="text-xs text-gray-400 mb-1">Destination</div>
          <div class="text-lg font-semibold text-white">
            {withdrawal.metadata.phone_number}
          </div>
          {#if withdrawal.metadata.provider}
            <div class="text-sm text-gray-400 mt-1">
              {withdrawal.metadata.provider === "orange_money"
                ? "Orange Money"
                : withdrawal.metadata.provider === "afrimoney"
                  ? "Afrimoney"
                  : withdrawal.metadata.provider}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Status -->
      <div class="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
        <div>
          <div class="text-xs text-gray-400 mb-1">Status</div>
          <div class="flex items-center gap-2">
            {#if isExpired}
              <span
                class="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full font-medium"
              >
                EXPIRED
              </span>
            {:else if signatureCount >= withdrawal.required_signatures}
              <span
                class="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium"
              >
                READY TO EXECUTE
              </span>
            {:else}
              <span
                class="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full font-medium"
              >
                PENDING APPROVAL
              </span>
            {/if}
          </div>
        </div>
        {#if withdrawal.expires_at && !isExpired}
          <div class="text-right">
            <div class="text-xs text-gray-400 mb-1">Time Remaining</div>
            <div class="text-sm font-medium text-gray-300">{timeRemaining}</div>
          </div>
        {/if}
      </div>

      <!-- Signature Progress -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-medium text-gray-300">
            Signatures Collected
          </div>
          <div class="text-sm text-gray-400">
            {signatureCount} / {withdrawal.required_signatures}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div
            class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style="width: {(signatureCount / withdrawal.required_signatures) * 100}%"
          ></div>
        </div>

        {#if remainingSignatures > 0 && !isExpired}
          <div class="text-center text-sm text-gray-400 mb-4">
            {remainingSignatures} more signature{remainingSignatures > 1
              ? "s"
              : ""} needed
          </div>
        {/if}
      </div>

      <!-- Collected Signatures -->
      {#if withdrawal.collected_signatures && withdrawal.collected_signatures.length > 0}
        <div class="mb-6">
          <div class="text-sm font-medium text-gray-300 mb-3">
            Signed By
          </div>
          <div class="space-y-2">
            {#each withdrawal.collected_signatures as signature (signature.wallet)}
              <div
                class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div class="text-white font-mono text-sm">
                      {formatWalletAddress(signature.wallet)}
                    </div>
                    <div class="text-xs text-gray-400">
                      {new Date(signature.signed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {#if signature.wallet === currentWallet}
                  <span
                    class="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                  >
                    Your Signature
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Sign Action -->
      {#if !isExpired && remainingSignatures > 0}
        <div class="pt-6 border-t border-gray-700">
          {#if !currentWallet}
            <div
              class="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-center"
            >
              <p class="text-yellow-400 text-sm mb-2">
                Connect your wallet to sign this withdrawal
              </p>
              <p class="text-yellow-300/70 text-xs">
                Only authorized signer wallets can approve this withdrawal
              </p>
            </div>
          {:else if !canSign}
            <div
              class="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-center"
            >
              <p class="text-red-400 text-sm">
                Your wallet is not authorized to sign this withdrawal
              </p>
            </div>
          {:else if hasAlreadySigned}
            <div
              class="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-center"
            >
              <p class="text-blue-400 text-sm">
                ✓ You have already signed this withdrawal
              </p>
            </div>
          {:else}
            <button
              on:click={signWithdrawal}
              disabled={isSigning}
              class="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {#if isSigning}
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
                Signing...
              {:else}
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Sign Withdrawal with {formatWalletAddress(currentWallet)}
              {/if}
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Info Card -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <svg
          class="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        How Multi-Signature Withdrawals Work
      </h3>
      <div class="space-y-2 text-sm text-gray-400">
        <p>
          • This withdrawal requires {withdrawal.required_signatures} signature{withdrawal.required_signatures > 1 ? "s" : ""} to be executed
        </p>
        <p>• Only authorized signer wallets can approve the withdrawal</p>
        <p>
          • Once the required number of signatures is collected, the withdrawal
          will execute automatically
        </p>
        {#if withdrawal.expires_at}
          <p>
            • This withdrawal will expire if not completed within 24 hours of
            creation
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>


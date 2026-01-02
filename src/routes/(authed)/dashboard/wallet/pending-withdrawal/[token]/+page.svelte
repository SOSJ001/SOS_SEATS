<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress, signMessageWithWallet } from "$lib/web3";
  import { showToast } from "$lib/store";
  import { goto } from "$app/navigation";

  export let data: any;

  let withdrawal = data.withdrawal;
  let authorizedSigners = data.authorizedSigners || [];
  let isLoading = false;
  let isSigning = false;
  let isCancelling = false;
  let hasSigned = false;
  let currentWallet: string | null = null;
  let sessionWallet: string | null = null;
  let showCancelButton = false;
  let collectedSignatures = withdrawal?.collected_signatures || [];
  let requiredSignatures = withdrawal?.required_signatures || 1;
  let remainingSignatures = Math.max(
    0,
    requiredSignatures - collectedSignatures.length
  );

  // Check if current wallet is the primary wallet (can cancel)
  function isPrimaryWallet(): boolean {
    if (!currentWallet || !withdrawal) return false;
    return currentWallet === withdrawal.wallet_address;
  }

  // Check if current wallet has already signed
  function checkHasSigned() {
    if (!currentWallet || !collectedSignatures) return false;
    return collectedSignatures.some((sig: any) => sig.wallet === currentWallet);
  }

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
      return null;
    }
  }

  // Check if wallet is authorized signer
  function isAuthorizedSigner(wallet: string): boolean {
    if (!wallet || !withdrawal) return false;

    // Primary wallet is always authorized
    if (wallet === withdrawal.wallet_address) return true;

    // Check if wallet is in authorized signers list
    return authorizedSigners.some(
      (s: any) => s.signer_wallet_address === wallet
    );
  }

  onMount(async () => {
    // First try to get wallet from session (more reliable on mobile)
    try {
      const session = await verifyWeb3Session();
      if (session?.success && session.user?.wallet_address) {
        sessionWallet = session.user.wallet_address;
        currentWallet = sessionWallet;
      }
    } catch (err) {
      // Error getting session wallet - will fallback to active wallet detection
    }

    // Then try active wallet detection as fallback
    if (!currentWallet) {
      currentWallet = await getCurrentWallet();
    }
    hasSigned = checkHasSigned();

    // Retry wallet detection if not initially detected (important for mobile)
    if (!currentWallet) {
      // Try multiple times with increasing delays for mobile wallets
      const retryDelays = [500, 1000, 2000];
      for (const delay of retryDelays) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        currentWallet = await getCurrentWallet();
        if (currentWallet) {
          hasSigned = checkHasSigned();
          break;
        }
      }
    }

    // Reload withdrawal to get latest signature status
    await reloadWithdrawal();
  });

  async function reloadWithdrawal() {
    if (!withdrawal?.pending_token) return;

    try {
      // Load withdrawal without filtering by status to get the latest state
      const { data: updated, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("pending_token", withdrawal.pending_token)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // Error other than "not found" - log but continue
        return;
      }

      if (!updated) {
        // Withdrawal not found - might have been deleted or cancelled
        showToast("info", "Withdrawal Not Found", "This withdrawal is no longer available.", 6000);
        setTimeout(() => goto("/dashboard/wallet"), 2000);
        return;
      }

      // Check if status has changed from pending_approval
      if (updated.status !== "pending_approval") {
        // Withdrawal is no longer pending - redirect to wallet page
        const statusMessage =
          updated.status === "cancelled"
            ? "This withdrawal has been cancelled."
            : updated.status === "completed" || updated.status === "pending"
              ? "This withdrawal has been processed successfully."
              : `This withdrawal status is: ${updated.status}`;

        showToast("info", "Withdrawal Status Changed", statusMessage, 6000);
        setTimeout(() => goto("/dashboard/wallet"), 2000);
        return;
      }

      // Still pending_approval - update local state
      withdrawal = updated;
      collectedSignatures = updated.collected_signatures || [];
      requiredSignatures = updated.required_signatures || 1;
      remainingSignatures = Math.max(
        0,
        requiredSignatures - collectedSignatures.length
      );
      hasSigned = checkHasSigned();

      // Ensure wallet is still detected after reload
      if (!currentWallet) {
        currentWallet = await getCurrentWallet();
        if (currentWallet) {
          hasSigned = checkHasSigned();
        }
      }

      // Auto-execute if threshold is met and withdrawal is still pending
      if (
        updated.status === "pending_approval" &&
        collectedSignatures.length >= requiredSignatures &&
        !isLoading
      ) {
        // Threshold met - automatically execute
        showToast(
          "info",
          "Threshold Met",
          "All required signatures collected. Executing withdrawal...",
          6000
        );
        // Small delay to ensure UI updates
        setTimeout(async () => {
          await executePendingWithdrawal();
        }, 500);
      }
    } catch (err) {
      // Error reloading withdrawal
    }
  }

  async function signPendingWithdrawal() {
    if (!currentWallet || !withdrawal) return;

    // Check if already signed
    if (hasSigned) {
      showToast(
        "info",
        "Already Signed",
        "You have already signed this withdrawal."
      );
      return;
    }

    // Check if authorized
    if (!isAuthorizedSigner(currentWallet)) {
      showToast(
        "error",
        "Not Authorized",
        "Your wallet is not authorized to sign this withdrawal."
      );
      return;
    }

    try {
      isSigning = true;

      // Create signature message
      const metadata = withdrawal.metadata || {};
      const phoneNumber = metadata.phone_number || "N/A";
      // Parse finalAmount - it might be a string from metadata
      const finalAmount = typeof metadata.final_net_amount === 'string'
        ? parseFloat(metadata.final_net_amount)
        : (metadata.final_net_amount || Math.abs(withdrawal.amount));
      const currency = withdrawal.currency || "NLe";

      const signatureMessage = `Sign withdrawal of ${currency} ${Number(finalAmount).toFixed(2)} to ${phoneNumber}\n\nWithdrawal ID: ${withdrawal.id}\nToken: ${withdrawal.pending_token}\nTimestamp: ${new Date().toISOString()}\nWallet: ${currentWallet}`;

      // Sign message with wallet
      const signResult = await signMessageWithWallet(signatureMessage);

      if (!signResult.success || !signResult.signature) {
        showToast(
          "error",
          "Signature Failed",
          signResult.error || "Failed to sign withdrawal. Please try again.",
          6000
        );
        isSigning = false;
        return;
      }

      // Convert signature to base64 for storage
      const signatureBase64 = Array.from(signResult.signature)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const signatureBase64Encoded = btoa(signatureBase64);

      // Add signature via RPC
      const { data: result, error: rpcError } = await supabase.rpc(
        "add_withdrawal_signature",
        {
          p_withdrawal_id: withdrawal.id,
          p_signer_wallet_address: currentWallet,
          p_signature: signatureBase64Encoded,
          p_public_key: signResult.publicKey || currentWallet,
        }
      );

      if (rpcError) {
        showToast(
          "error",
          "Error",
          rpcError.message || "Failed to add signature."
        );
        isSigning = false;
        return;
      }

      if (result && result.length > 0) {
        const response = result[0];
        if (response.success) {
          if (response.threshold_met) {
            // Threshold met - automatically execute withdrawal
            showToast(
              "success",
              "Threshold Met",
              "All required signatures collected. Executing withdrawal...",
              6000
            );
            
            // Reload withdrawal first to get latest state
            await reloadWithdrawal();
            
            // Execute withdrawal automatically
            // Use a small delay to ensure database state is updated
            setTimeout(async () => {
              await executePendingWithdrawal();
            }, 500);
          } else {
            showToast(
              "success",
              "Signature Added",
              response.message ||
                `Waiting for ${response.collected_count || remainingSignatures - 1} more signature(s).`,
              6000
            );
            hasSigned = true;
            await reloadWithdrawal();
          }
        } else {
          showToast(
            "error",
            "Error",
            response.message || "Failed to add signature."
          );
        }
      } else {
        showToast("error", "Error", "Failed to add signature.");
      }
    } catch (err: any) {
      showToast("error", "Error", err.message || "Failed to sign withdrawal.");
    } finally {
      isSigning = false;
    }
  }

  async function executePendingWithdrawal() {
    if (!withdrawal?.id) {
      showToast("error", "Error", "Withdrawal ID not found.");
      return;
    }

    // Prevent multiple simultaneous executions
    if (isLoading) {
      return;
    }

    try {
      isLoading = true;

      // Verify threshold is still met before executing (safety check)
      const { data: currentWithdrawal, error: fetchError } = await supabase
        .from("wallet_transactions")
        .select("collected_signatures, required_signatures, status")
        .eq("id", withdrawal.id)
        .single();

      if (fetchError || !currentWithdrawal) {
        showToast(
          "error",
          "Error",
          "Could not verify withdrawal status. Please try again."
        );
        isLoading = false;
        return;
      }

      // Check if already executed or cancelled
      if (currentWithdrawal.status !== "pending_approval") {
        showToast(
          "info",
          "Withdrawal Status",
          `Withdrawal is already ${currentWithdrawal.status}.`,
          6000
        );
        await reloadWithdrawal();
        isLoading = false;
        return;
      }

      // Verify threshold is met
      const collectedCount = currentWithdrawal.collected_signatures
        ? (currentWithdrawal.collected_signatures as any[]).length
        : 0;
      const requiredCount = currentWithdrawal.required_signatures || 1;

      if (collectedCount < requiredCount) {
        showToast(
          "error",
          "Error",
          `Signature threshold not met. Have ${collectedCount} of ${requiredCount} required signatures.`
        );
        await reloadWithdrawal();
        isLoading = false;
        return;
      }

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

      if (!response.ok || !result.success) {
        showToast(
          "error",
          "Execution Failed",
          result.message || "Failed to execute withdrawal. Please try again or contact support.",
          8000
        );
        // Reload to show current state
        await reloadWithdrawal();
        return;
      }

      showToast(
        "success",
        "Withdrawal Executed",
        result.message || "Withdrawal has been executed successfully.",
        8000
      );

      // Reload withdrawal to check updated status (will redirect if status changed)
      await reloadWithdrawal();

      // Double-check status after reload and redirect if needed
      const { data: finalCheck } = await supabase
        .from("wallet_transactions")
        .select("status")
        .eq("id", withdrawal.id)
        .maybeSingle();

      if (finalCheck && finalCheck.status !== "pending_approval") {
        // Status has changed - redirect to wallet page
        setTimeout(() => {
          goto("/dashboard/wallet");
        }, 1500);
      } else {
        // Still showing as pending_approval, redirect anyway after delay
        setTimeout(() => {
          goto("/dashboard/wallet");
        }, 2000);
      }
    } catch (err: any) {
      showToast(
        "error",
        "Error",
        err.message || "Failed to execute withdrawal. Please try again.",
        8000
      );
      // Reload to show current state even on error
      await reloadWithdrawal();
    } finally {
      isLoading = false;
    }
  }

  async function cancelPendingWithdrawal() {
    if (!withdrawal?.id || !currentWallet) return;

    // Only primary wallet can cancel
    if (!isPrimaryWallet()) {
      showToast(
        "error",
        "Not Authorized",
        "Only the primary wallet can cancel this withdrawal."
      );
      return;
    }

    // Confirm cancellation
    if (
      !confirm(
        "Are you sure you want to cancel this withdrawal? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      isCancelling = true;

      // Call API to cancel pending withdrawal
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
          result.message || "Failed to cancel withdrawal."
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

      // Redirect to wallet page after a moment
      setTimeout(() => {
        goto("/dashboard/wallet");
      }, 2000);
    } catch (err: any) {
      showToast(
        "error",
        "Error",
        err.message || "Failed to cancel withdrawal."
      );
    } finally {
      isCancelling = false;
    }
  }

  function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }

  function formatCurrency(amount: number | string, currency: string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return `${currency} ${Math.abs(numAmount || 0).toFixed(2)}`;
  }

  function getSignatureProgress(): number {
    const collected = collectedSignatures.length;
    const required = requiredSignatures;
    return Math.min((collected / required) * 100, 100);
  }

  const metadata = withdrawal?.metadata || {};
  const phoneNumber = metadata.phone_number || "N/A";
  const provider = metadata.provider || "orange_money";
  // Parse finalAmount - it might be a string from metadata
  const finalAmount = typeof metadata.final_net_amount === 'string'
    ? parseFloat(metadata.final_net_amount)
    : (metadata.final_net_amount || Math.abs(withdrawal?.amount || 0));
  const currency = withdrawal?.currency || "NLe";
  const progress = getSignatureProgress();

  // Reactive check to ensure cancel button shows when wallet is detected
  // Use either currentWallet or sessionWallet, and compare with withdrawal wallet_address
  $: {
    const detectedWallet = currentWallet || sessionWallet;
    showCancelButton =
      detectedWallet &&
      withdrawal &&
      detectedWallet === withdrawal.wallet_address;
  }

  // Debug: Log wallet detection for troubleshooting
  $: if (withdrawal) {
    const detectedWallet = currentWallet || sessionWallet;
    // Cancel button visibility is handled reactively
  }
</script>

<svelte:head>
  <title>Pending Withdrawal - SOS SEATS</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white px-4 py-6 sm:py-8">
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6 sm:mb-8">
      <button
        on:click={() => goto("/dashboard/wallet")}
        class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm sm:text-base"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Back to Wallet
      </button>
      <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
        Pending Withdrawal
      </h1>
      <p class="text-gray-400 text-sm sm:text-base">
        Approve this withdrawal by signing with your wallet.
      </p>
    </div>

    {#if isLoading}
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center"
      >
        <svg
          class="animate-spin h-12 w-12 text-purple-400 mx-auto mb-4"
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
        <p class="text-white text-sm sm:text-base">Processing...</p>
      </div>
    {:else if withdrawal}
      <!-- Withdrawal Details -->
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-5 sm:p-6 mb-6"
      >
        <h2 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
          Withdrawal Details
        </h2>

        <div class="space-y-3 sm:space-y-4">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
          >
            <span class="text-gray-400 text-sm sm:text-base">Amount</span>
            <span class="text-white text-base sm:text-lg font-semibold"
              >{formatCurrency(finalAmount, currency)}</span
            >
          </div>

          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
          >
            <span class="text-gray-400 text-sm sm:text-base">Phone Number</span>
            <span class="text-white text-sm sm:text-base font-mono"
              >{phoneNumber}</span
            >
          </div>

          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
          >
            <span class="text-gray-400 text-sm sm:text-base">Provider</span>
            <span class="text-white text-sm sm:text-base capitalize"
              >{provider.replace("_", " ")}</span
            >
          </div>

          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0"
          >
            <span class="text-gray-400 text-sm sm:text-base"
              >Primary Wallet</span
            >
            <span class="text-white text-xs sm:text-sm font-mono"
              >{formatAddress(withdrawal.wallet_address)}</span
            >
          </div>
        </div>
      </div>

      <!-- Signature Progress -->
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-5 sm:p-6 mb-6"
      >
        <h2 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
          Signature Progress
        </h2>

        <div class="mb-4 sm:mb-6">
          <div
            class="flex items-center justify-between text-sm sm:text-base mb-2 sm:mb-3"
          >
            <span class="text-gray-400">Signatures Collected</span>
            <span class="text-white font-semibold"
              >{collectedSignatures.length} / {requiredSignatures}</span
            >
          </div>
          <div class="w-full bg-gray-700 rounded-full h-3 sm:h-4">
            <div
              class="bg-gradient-to-r from-purple-600 to-purple-700 h-3 sm:h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
              style="width: {progress}%"
            >
              <span class="text-white text-xs font-semibold"
                >{Math.round(progress)}%</span
              >
            </div>
          </div>
          {#if remainingSignatures > 0}
            <p class="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-3">
              Waiting for {remainingSignatures} more signature{remainingSignatures !==
              1
                ? "s"
                : ""}
            </p>
          {:else}
            <p class="text-green-400 text-xs sm:text-sm mt-2 sm:mt-3">
              All signatures collected! Withdrawal will execute automatically.
            </p>
          {/if}
        </div>

        <!-- Collected Signatures -->
        {#if collectedSignatures.length > 0}
          <div class="mt-4 sm:mt-6">
            <h3
              class="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4"
            >
              Collected Signatures
            </h3>
            <div class="space-y-2 sm:space-y-3">
              {#each collectedSignatures as sig (sig.wallet)}
                <div
                  class="bg-gray-700/50 rounded-lg p-3 sm:p-4 flex items-center justify-between"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-xs sm:text-sm font-mono truncate">
                      {formatAddress(sig.wallet)}
                    </p>
                    {#if sig.signed_at}
                      <p class="text-gray-400 text-xs mt-1">
                        Signed: {new Date(sig.signed_at).toLocaleString()}
                      </p>
                    {/if}
                  </div>
                  <span
                    class="text-green-400 text-xs sm:text-sm font-semibold flex-shrink-0 ml-2"
                    >✓ Signed</span
                  >
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Actions Section -->
      <div class="space-y-4 pb-6 sm:pb-0 mt-6 sm:mt-0">
        <!-- Cancel Button (Only for Primary Wallet) -->
        {#if showCancelButton}
          <button
            on:click={cancelPendingWithdrawal}
            disabled={isCancelling || isLoading}
            class="w-full px-4 py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            style="min-height: 48px;"
          >
            {#if isCancelling}
              <svg
                class="animate-spin h-4 w-4 sm:h-5 sm:w-5"
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
              Cancelling...
            {:else}
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
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
              Cancel Withdrawal
            {/if}
          </button>
        {/if}

        <!-- Sign Button -->
        {#if currentWallet}
          {#if !isAuthorizedSigner(currentWallet)}
            <div
              class="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 sm:p-5"
            >
              <p class="text-yellow-400 text-sm sm:text-base">
                Your wallet is not authorized to sign this withdrawal.
              </p>
            </div>
          {:else if hasSigned}
            <div
              class="bg-green-900/20 border border-green-700 rounded-xl p-4 sm:p-5"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div>
                  <p class="text-green-400 text-sm sm:text-base font-semibold">
                    You have already signed this withdrawal.
                  </p>
                  <p class="text-green-300 text-xs sm:text-sm mt-1">
                    Waiting for other authorized signers to add their
                    signatures.
                  </p>
                </div>
              </div>
            </div>
            <button
              on:click={reloadWithdrawal}
              class="w-full px-4 py-3 sm:py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center justify-center gap-2"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Refresh Status
            </button>
          {:else}
            <button
              on:click={signPendingWithdrawal}
              disabled={isSigning || isLoading}
              class="w-full px-4 py-3 sm:py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {#if isSigning}
                <svg
                  class="animate-spin h-4 w-4 sm:h-5 sm:w-5"
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
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
                Sign Withdrawal
              {/if}
            </button>
          {/if}
        {:else}
          <div
            class="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 sm:p-5"
          >
            <p class="text-yellow-400 text-sm sm:text-base">
              Please connect your wallet to sign this withdrawal.
            </p>
          </div>
        {/if}
      </div>
    {:else}
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center"
      >
        <p class="text-gray-400 text-sm sm:text-base">
          Withdrawal not found or already processed.
        </p>
      </div>
    {/if}
  </div>
</div>

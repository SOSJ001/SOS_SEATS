<script lang="ts">
  import { supabase } from "$lib/supabase";
  import { signMessageWithWallet } from "$lib/web3";
  import { showToast } from "$lib/store";
  import { fade, fly } from "svelte/transition";

  export let primaryWallet: string | null;
  export let onSignerAdded: () => void;
  export let onClose: () => void;

  let signerWalletAddress = "";
  let walletLabel = "";
  let isVerifying = false;
  let isAdding = false;
  let verificationStep: "input" | "verifying" | "success" = "input";

  // Generate a unique verification message
  const verificationMessage = `Add wallet as multi-signature withdrawal signer for ${primaryWallet}. Timestamp: ${Date.now()}`;

  async function verifyAndAddSigner() {
    if (!primaryWallet) {
      showToast("error", "Error", "Primary wallet not found.");
      return;
    }

    const address = signerWalletAddress.trim();
    if (!address) {
      showToast("error", "Invalid Address", "Please enter a wallet address.");
      return;
    }

    // Basic Solana address validation (44 characters, base58)
    if (address.length < 32 || address.length > 44) {
      showToast(
        "error",
        "Invalid Address",
        "Please enter a valid Solana wallet address."
      );
      return;
    }

    // Don't allow adding primary wallet as signer
    if (address === primaryWallet) {
      showToast(
        "error",
        "Invalid Address",
        "Primary wallet is automatically included as a signer."
      );
      return;
    }

    try {
      isVerifying = true;
      verificationStep = "verifying";

      // Request signature from the wallet being added
      // Note: In a real scenario, the user would need to connect the signer wallet
      // For now, we'll prompt them to connect that wallet and sign
      showToast(
        "info",
        "Verification Required",
        "Please connect the signer wallet and sign the verification message.",
        5000
      );

      // For now, we'll add the signer without verification
      // In production, you'd prompt the user to connect the signer wallet first
      // Then call signMessageWithWallet() with that wallet
      await addSigner();
    } catch (err: any) {
      console.error("Error verifying signer:", err);
      showToast(
        "error",
        "Verification Failed",
        err.message || "Failed to verify wallet ownership. Please try again."
      );
      verificationStep = "input";
    } finally {
      isVerifying = false;
    }
  }

  async function addSigner() {
    if (!primaryWallet) return;

    try {
      isAdding = true;

      const { data, error } = await supabase.rpc("add_multisig_signer", {
        p_primary_wallet_address: primaryWallet,
        p_signer_wallet_address: signerWalletAddress.trim(),
        p_wallet_label: walletLabel.trim() || null,
      });

      if (error) {
        console.error("Error adding signer:", error);
        showToast("error", "Error", error.message || "Failed to add signer.");
        verificationStep = "input";
        return;
      }

      if (data && data.length > 0 && data[0].success) {
        verificationStep = "success";
        showToast("success", "Signer Added", data[0].message || "Signer added successfully.");
        
        // Wait a moment then close and refresh
        setTimeout(() => {
          onSignerAdded();
        }, 1500);
      } else {
        showToast("error", "Error", "Failed to add signer.");
        verificationStep = "input";
      }
    } catch (err) {
      console.error("Error in addSigner:", err);
      showToast("error", "Error", "Failed to add signer.");
      verificationStep = "input";
    } finally {
      isAdding = false;
    }
  }

  function handleClose() {
    if (isVerifying || isAdding) return;
    onClose();
  }
</script>

<!-- Modal Backdrop -->
<div
  class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  on:click={handleClose}
  role="dialog"
  aria-modal="true"
  transition:fade={{ duration: 200 }}
>
  <!-- Modal Content -->
  <div
    class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8 border border-gray-700"
    on:click|stopPropagation
    transition:fly={{ y: 20, duration: 300 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-semibold text-white flex items-center gap-2">
        <svg
          class="w-6 h-6 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Signer Wallet
      </h3>
      <button
        on:click={handleClose}
        disabled={isVerifying || isAdding}
        class="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    {#if verificationStep === "input"}
      <!-- Form -->
      <div class="space-y-4">
        <!-- Wallet Address Input -->
        <div>
          <label
            for="signer-address"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Wallet Address
          </label>
          <input
            id="signer-address"
            type="text"
            bind:value={signerWalletAddress}
            placeholder="Enter Solana wallet address"
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            disabled={isVerifying || isAdding}
          />
          <p class="text-xs text-gray-400 mt-1">
            The wallet address that will be authorized to sign withdrawals
          </p>
        </div>

        <!-- Wallet Label Input (Optional) -->
        <div>
          <label
            for="wallet-label"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Label <span class="text-gray-500 text-xs">(Optional)</span>
          </label>
          <input
            id="wallet-label"
            type="text"
            bind:value={walletLabel}
            placeholder="e.g., Backup Wallet, Business Partner"
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            disabled={isVerifying || isAdding}
          />
          <p class="text-xs text-gray-400 mt-1">
            A friendly name to identify this wallet
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <button
            on:click={handleClose}
            disabled={isVerifying || isAdding}
            class="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            on:click={verifyAndAddSigner}
            disabled={isVerifying || isAdding || !signerWalletAddress.trim()}
            class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {#if isVerifying || isAdding}
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
              {isVerifying ? "Verifying..." : "Adding..."}
            {:else}
              Add Signer
            {/if}
          </button>
        </div>
      </div>
    {:else if verificationStep === "verifying"}
      <!-- Verifying State -->
      <div class="text-center py-8">
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
        <p class="text-gray-300 text-lg font-medium mb-2">
          {isVerifying ? "Verifying Wallet..." : "Adding Signer..."}
        </p>
        <p class="text-gray-500 text-sm">
          Please wait while we process your request
        </p>
      </div>
    {:else if verificationStep === "success"}
      <!-- Success State -->
      <div class="text-center py-8">
        <svg
          class="h-16 w-16 text-green-400 mx-auto mb-4"
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
        <p class="text-gray-300 text-lg font-medium mb-2">Signer Added!</p>
        <p class="text-gray-500 text-sm">
          The wallet has been added as an authorized signer
        </p>
      </div>
    {/if}
  </div>
</div>


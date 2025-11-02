<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { supabase } from "$lib/supabase";
  import { showToast } from "$lib/store";
  import { signMessageWithWallet } from "$lib/web3";

  export let primaryWallet: string;
  export let onSignerAdded: () => void;
  export let onClose: () => void;

  const dispatch = createEventDispatcher();

  let signerWalletAddress = "";
  let walletLabel = "";
  let isAdding = false;
  let verificationStep: "input" | "signing" | "verifying" | "success" | "error" = "input";

  async function addSigner() {
    if (!primaryWallet) return;

    // Validate wallet address format (basic Solana address check)
    const trimmedAddress = signerWalletAddress.trim();
    if (!trimmedAddress || trimmedAddress.length < 32) {
      showToast("error", "Invalid Address", "Please enter a valid wallet address.");
      return;
    }

    if (trimmedAddress === primaryWallet) {
      showToast("error", "Invalid Address", "Signer wallet cannot be the same as your primary wallet.");
      return;
    }

    try {
      isAdding = true;
      verificationStep = "signing";

      // Create message to sign
      const message = `Add signer wallet ${trimmedAddress} to multisig configuration for ${primaryWallet}\n\nSigner Label: ${walletLabel.trim() || "None"}\nTimestamp: ${new Date().toISOString()}\n\nBy signing this message, you authorize adding this wallet as a signer to your multisig configuration.`;

      // Request wallet signature
      const signResult = await signMessageWithWallet(message);

      if (!signResult.success || !signResult.signature) {
        showToast(
          "error",
          "Signature Required",
          signResult.error || "Failed to sign message. Please try again.",
        );
        verificationStep = "input";
        isAdding = false;
        return;
      }

      // Convert signature to base64 for storage
      const signatureBase64 = Array.from(signResult.signature)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const signatureBase64Encoded = btoa(signatureBase64);

      verificationStep = "verifying";

      const { data, error } = await supabase.rpc("add_multisig_signer", {
        p_primary_wallet_address: primaryWallet,
        p_signer_wallet_address: trimmedAddress,
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
    if (verificationStep === "signing" || verificationStep === "verifying") return; // Prevent closing during signing/verification
    signerWalletAddress = "";
    walletLabel = "";
    verificationStep = "input";
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && verificationStep !== "signing" && verificationStep !== "verifying") {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- Backdrop -->
<button
  type="button"
  class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4 border-none cursor-default"
  on:click={handleClose}
  on:keydown={(e) => e.key === "Escape" && handleClose()}
  aria-label="Close modal"
></button>

<!-- Modal Content -->
<div
  class="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <div
    class="bg-gray-800 border border-gray-700 rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl pointer-events-auto"
    on:click|stopPropagation
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h2 id="modal-title" class="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        Add Signer Wallet
      </h2>
      {#if verificationStep !== "signing" && verificationStep !== "verifying"}
        <button
          on:click={handleClose}
          class="text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close modal"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      {/if}
    </div>

    {#if verificationStep === "input"}
      <!-- Input Form -->
      <div class="space-y-4 sm:space-y-5">
        <div>
          <label for="wallet-label" class="block text-sm sm:text-base font-semibold text-white mb-2">
            Wallet Label (Optional)
          </label>
          <input
            id="wallet-label"
            type="text"
            bind:value={walletLabel}
            placeholder="e.g., Backup Wallet, Business Partner"
            class="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isAdding}
          />
        </div>

        <div>
          <label for="wallet-address" class="block text-sm sm:text-base font-semibold text-white mb-2">
            Signer Wallet Address <span class="text-red-400">*</span>
          </label>
          <input
            id="wallet-address"
            type="text"
            bind:value={signerWalletAddress}
            placeholder="Enter Solana wallet address"
            class="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm sm:text-base font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isAdding}
          />
          <p class="text-gray-400 text-xs mt-1.5 sm:mt-2">Enter the Solana wallet address that will be authorized to sign withdrawals.</p>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-3 pt-2">
          <button
            on:click={handleClose}
            disabled={isAdding}
            class="flex-1 px-4 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm sm:text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            on:click={addSigner}
            disabled={isAdding || !signerWalletAddress.trim()}
            class="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isAdding}
              <span class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            {:else}
              Add Signer
            {/if}
          </button>
        </div>
      </div>
    {:else if verificationStep === "signing"}
      <!-- Signing State -->
      <div class="text-center py-6 sm:py-8">
        <svg class="animate-pulse h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
        </svg>
        <p class="text-white text-sm sm:text-base font-semibold mb-2">Waiting for Signature...</p>
        <p class="text-gray-400 text-xs sm:text-sm">Please approve the signature request in your wallet to authorize adding this signer.</p>
      </div>
    {:else if verificationStep === "verifying"}
      <!-- Verifying State -->
      <div class="text-center py-6 sm:py-8">
        <svg class="animate-spin h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-white text-sm sm:text-base font-semibold mb-2">Adding Signer...</p>
        <p class="text-gray-400 text-xs sm:text-sm">Please wait while we add the signer wallet.</p>
      </div>
    {:else if verificationStep === "success"}
      <!-- Success State -->
      <div class="text-center py-6 sm:py-8">
        <svg class="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-white text-sm sm:text-base font-semibold mb-2">Signer Added Successfully!</p>
        <p class="text-gray-400 text-xs sm:text-sm">The signer wallet has been added to your multisig configuration.</p>
      </div>
    {/if}
  </div>
</div>



<script lang="ts">
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress, signMessageWithWallet } from "$lib/web3";
  import { showToast } from "$lib/store";
  import AddSignerWalletModal from "./AddSignerWalletModal.svelte";

  // Props
  export let walletAddress: string | null = null;

  // State
  let isLoading = false;
  let isEnabled = false;
  let requiredSignatures = 2;
  let totalAvailableSigners = 1;
  let signers: any[] = [];
  let primaryWallet: string | null = null;
  let primaryUserId: string | null = null;
  let multisigConfig: any = null;
  let showAddSignerModal = false;
  let walletError = false;
  
  // Track original state to detect changes
  let originalIsEnabled = false;
  let originalRequiredSignatures = 2;
  
  // Check if there are changes to save (only track required signatures now, isEnabled is auto-managed)
  $: hasChanges = originalRequiredSignatures !== requiredSignatures;

  onMount(() => {
    loadMultisigConfig();
  });

  // Reactive: Reload when wallet address changes
  $: if (walletAddress && walletAddress !== primaryWallet) {
    loadMultisigConfig();
  }

  async function loadMultisigConfig() {
    try {
      isLoading = true;

      // Use provided wallet address prop, or try to get it
      let walletToUse = walletAddress;
      
      if (!walletToUse) {
        // Try multiple methods to get wallet address
        const session = await verifyWeb3Session();
        if (session?.success && session.user?.wallet_address) {
          walletToUse = session.user.wallet_address;
        } else {
          walletToUse = getActiveWalletAddress();
          
          // Try to get from window.solana directly
          if (!walletToUse && typeof window !== "undefined") {
            const w = window as any;
            if (w.solana?.publicKey) {
              walletToUse = w.solana.publicKey.toBase58 ? w.solana.publicKey.toBase58() : w.solana.publicKey.toString();
            } else if (w.solflare?.publicKey) {
              walletToUse = w.solflare.publicKey.toBase58 ? w.solflare.publicKey.toBase58() : w.solflare.publicKey.toString();
            } else if (w.backpack?.publicKey) {
              walletToUse = w.backpack.publicKey.toBase58 ? w.backpack.publicKey.toBase58() : w.backpack.publicKey.toString();
            }
          }
        }
      }

      primaryWallet = walletToUse;

      if (!primaryWallet) {
        walletError = true;
        isLoading = false;
        return;
      }
      
      walletError = false;

      // Get user ID - prioritize web3_users table lookup since that's most reliable
      if (primaryWallet) {
        const { data: web3User, error: userError } = await supabase
          .from("web3_users")
          .select("id")
          .eq("wallet_address", primaryWallet)
          .maybeSingle();
        
        if (web3User?.id) {
          primaryUserId = web3User.id;
        }
      }
      
      // If still no user ID, try auth session
      if (!primaryUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        primaryUserId = sessionData?.session?.user?.id || null;
      }
      
      // If still no user ID, try Web3 session
      if (!primaryUserId) {
        const session = await verifyWeb3Session();
        if (session?.success && session.user?.id) {
          primaryUserId = session.user.id;
        }
      }
      
      // Call get_multisig_config function
      const { data, error } = await supabase.rpc("get_multisig_config", {
        p_wallet_address: primaryWallet,
      });

      if (error) {
        // Check if it's a "no rows" error (which is fine for new configs)
        // PostgreSQL function returning no rows is not always P0001, check error message
        const errorMsg = error.message?.toLowerCase() || "";
        if (!errorMsg.includes("no rows") && !errorMsg.includes("not found") && error.code !== "P0001") {
          console.error("Error loading multisig config:", error);
          // Don't show error toast for missing config - that's normal for new wallets
        }
      }

      // Load signers using RPC function to bypass RLS issues with Web3 users
      let activeSigners: any[] = [];
      let signerCount = 1; // Default to just primary wallet
      
      const { data: signersData, error: signersError } = await supabase.rpc("get_multisig_signers", {
        p_wallet_address: primaryWallet,
      });

      if (signersError) {
        console.error("Error fetching signers via RPC:", signersError);
        // Fallback to direct query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("wallet_multisig_signers")
          .select("*")
          .eq("primary_wallet_address", primaryWallet)
          .eq("is_active", true)
          .order("added_at", { ascending: false });
        
        if (!fallbackError && fallbackData) {
          activeSigners = fallbackData || [];
          signerCount = activeSigners.length + 1;
        } else {
          console.error("Fallback query also failed:", fallbackError);
          activeSigners = [];
          signerCount = 1; // Just primary wallet
        }
      } else {
        activeSigners = signersData || [];
        signerCount = activeSigners.length + 1; // +1 for primary wallet
      }
      

      if (data && data.length > 0) {
        // Config exists
        const config = data[0];
        // Always use fresh signer count from activeSigners (actual current signers in DB)
        // Recalculate from fresh activeSigners to ensure we have the latest count
        const finalSignerCount = activeSigners.length + 1; // +1 for primary wallet
        
        // Always use fresh signers from database, not from RPC response
        const freshSigners = activeSigners.map(s => ({
          id: s.id,
          signer_wallet_address: s.signer_wallet_address,
          wallet_label: s.wallet_label,
          is_active: s.is_active,
          added_at: s.added_at,
        }));
        
        multisigConfig = {
          config_id: config.config_id,
          primary_wallet_address: config.primary_wallet_address,
          primary_user_id: config.primary_user_id,
          required_signatures: config.required_signatures,
          is_enabled: config.is_enabled,
          total_signers: finalSignerCount,
          signers: freshSigners,
        };

        // Auto-enable multisig if signers exist (even if config says disabled)
        const shouldAutoEnable = finalSignerCount >= 2;
        isEnabled = shouldAutoEnable ? true : multisigConfig.is_enabled;
        requiredSignatures = multisigConfig.required_signatures;
        totalAvailableSigners = finalSignerCount;
        signers = freshSigners;
        
        // Save original state to detect changes
        originalIsEnabled = shouldAutoEnable ? true : multisigConfig.is_enabled;
        originalRequiredSignatures = multisigConfig.required_signatures;
        
        // If we auto-enabled, save the config to database
        if (shouldAutoEnable && !multisigConfig.is_enabled && primaryWallet && primaryUserId) {
          // Auto-save in background (don't wait for it)
          supabase.rpc("upsert_multisig_config", {
            p_wallet_address: primaryWallet,
            p_user_id: primaryUserId,
            p_required_signatures: requiredSignatures,
            p_is_enabled: true,
          }).catch(err => {
            console.error("Error auto-enabling multisig on load:", err);
          });
        }
        
      } else {
        // No config exists yet, but we can show signers if they exist
        if (activeSigners.length > 0) {
          // Signers exist but no config - create a default config state
          multisigConfig = {
            config_id: null,
            primary_wallet_address: primaryWallet,
            primary_user_id: primaryUserId || "",
            required_signatures: 2,
            is_enabled: false,
            total_signers: signerCount,
            signers: activeSigners.map(s => ({
              id: s.id,
              signer_wallet_address: s.signer_wallet_address,
              wallet_label: s.wallet_label,
              is_active: s.is_active,
              added_at: s.added_at,
            })),
          };
          signers = activeSigners.map(s => ({
            id: s.id,
            signer_wallet_address: s.signer_wallet_address,
            wallet_label: s.wallet_label,
            is_active: s.is_active,
            added_at: s.added_at,
          }));
        } else {
          multisigConfig = null;
        }
        isEnabled = false;
        requiredSignatures = 2;
        totalAvailableSigners = signerCount;
        
        // Save original state (no config exists, so defaults)
        originalIsEnabled = false;
        originalRequiredSignatures = 2;
      }
    } catch (err) {
      console.error("Error in loadMultisigConfig:", err);
      showToast("error", "Error", "Failed to load multisig settings.");
    } finally {
      isLoading = false;
    }
  }

  async function saveMultisigConfig() {
    if (!primaryWallet || !primaryUserId) {
      showToast("error", "Error", "Wallet address or user ID not found.");
      return;
    }

    // Validation
    if (totalAvailableSigners < 2) {
      showToast("error", "Invalid Configuration", "You need at least 2 signers (including your primary wallet) to use multisig.");
      return;
    }

    if (requiredSignatures < 2) {
      showToast("error", "Invalid Configuration", "Multisig requires at least 2 signatures.");
      return;
    }

    if (requiredSignatures > totalAvailableSigners) {
      showToast("error", "Invalid Configuration", `Required signatures (${requiredSignatures}) cannot exceed total signers (${totalAvailableSigners}).`);
      return;
    }

    try {
      isLoading = true;

      // Auto-enable multisig if there are signers (multisig is always enabled when signers exist)
      const shouldEnable = totalAvailableSigners >= 2;
      if (shouldEnable) {
        isEnabled = true;
      }

      const { data, error } = await supabase.rpc("upsert_multisig_config", {
        p_wallet_address: primaryWallet,
        p_user_id: primaryUserId,
        p_required_signatures: requiredSignatures,
        p_is_enabled: shouldEnable, // Always enable if signers exist
      });

      if (error) {
        console.error("Error saving multisig config:", error);
        showToast("error", "Error", error.message || "Failed to save multisig settings.");
        return;
      }

      if (data && data.length > 0 && data[0].success) {
        showToast("success", "Settings Saved", data[0].message || "Multisig settings saved successfully.");
        // Update original state to match current state
        originalIsEnabled = isEnabled;
        originalRequiredSignatures = requiredSignatures;
        await loadMultisigConfig();
      } else {
        showToast("error", "Error", "Failed to save multisig settings.");
      }
    } catch (err) {
      console.error("Error in saveMultisigConfig:", err);
      showToast("error", "Error", "Failed to save multisig settings.");
    } finally {
      isLoading = false;
    }
  }

  async function removeSigner(signerAddress: string) {
    if (!primaryWallet) return;

    try {
      isLoading = true;

      // Step 1: Get primary wallet signature (for authorization)
      const primaryMessage = `Authorize removal of signer wallet ${signerAddress} from multisig configuration for ${primaryWallet}\n\nTimestamp: ${new Date().toISOString()}\n\nBy signing this message, you authorize removing this wallet as a signer from your multisig configuration. All pending withdrawals requiring this signer will be cancelled.`;

      // Check if current wallet is the primary wallet
      const currentWallet = getActiveWalletAddress();
      if (!currentWallet || currentWallet !== primaryWallet) {
        showToast(
          "error",
          "Primary Wallet Required",
          "Please connect the primary wallet to remove a signer.",
        );
        isLoading = false;
        return;
      }

      // Request primary wallet signature
      const primarySignResult = await signMessageWithWallet(primaryMessage);

      if (!primarySignResult.success || !primarySignResult.signature) {
        showToast(
          "error",
          "Signature Required",
          primarySignResult.error || "Failed to sign message. Please try again.",
        );
        isLoading = false;
        return;
      }

      // Convert primary signature to base64
      const primarySignatureBase64 = Array.from(primarySignResult.signature)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const primarySignatureBase64Encoded = btoa(primarySignatureBase64);

      // Step 2: Call remove function - this will send notification to signer
      const { data, error } = await supabase.rpc("remove_multisig_signer", {
        p_primary_wallet_address: primaryWallet,
        p_signer_wallet_address: signerAddress,
        p_primary_wallet_signature: primarySignatureBase64Encoded,
      });

      if (error) {
        console.error("Error removing signer:", error);
        showToast("error", "Error", error.message || "Failed to remove signer.");
        isLoading = false;
        return;
      }

      if (data && data.length > 0 && data[0].success) {
        showToast(
          "success",
          "Removal Request Sent",
          data[0].message || "A removal request has been sent to the signer. They will be notified and must approve the removal.",
          8000
        );
        // Note: Don't reload config yet - signer still needs to approve
        // The config will be updated when signer approves
      } else {
        showToast("error", "Error", data?.[0]?.message || "Failed to send removal request.");
      }
    } catch (err) {
      console.error("Error in removeSigner:", err);
      showToast("error", "Error", "Failed to remove signer.");
    } finally {
      isLoading = false;
    }
  }

  async function handleSignerAdded() {
    showAddSignerModal = false;
    // Wait a moment for database update to commit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force reload the config - this will fetch fresh signers from the database
    // Clear state variables to force fresh reload
    signers = [];
    totalAvailableSigners = 1;
    
    // Reload fresh from database
    await loadMultisigConfig();
    
    // Double-check: if signers still not loaded, try again with a longer delay
    if (signers.length === 0 && totalAvailableSigners === 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await loadMultisigConfig();
    }
    
    // Auto-enable multisig when a signer is added (if we now have at least 2 signers)
    if (totalAvailableSigners >= 2 && !isEnabled && primaryWallet && primaryUserId) {
      isEnabled = true;
      // Ensure required signatures is at least 2 and doesn't exceed total signers
      if (requiredSignatures < 2) {
        requiredSignatures = 2;
      }
      if (requiredSignatures > totalAvailableSigners) {
        requiredSignatures = totalAvailableSigners;
      }
      
      // Automatically save the config with multisig enabled
      try {
        const { data, error } = await supabase.rpc("upsert_multisig_config", {
          p_wallet_address: primaryWallet,
          p_user_id: primaryUserId,
          p_required_signatures: requiredSignatures,
          p_is_enabled: true, // Auto-enable when signer is added
        });

        if (error) {
          console.error("Error auto-enabling multisig:", error);
          // Don't show error toast - this is automatic
        } else if (data && data.length > 0 && data[0].success) {
          // Update original state to match
          originalIsEnabled = true;
          originalRequiredSignatures = requiredSignatures;
          showToast("success", "Multi-Signature Enabled", "Multi-signature withdrawals have been automatically enabled.", 5000);
        }
      } catch (err) {
        console.error("Error auto-enabling multisig:", err);
        // Don't show error toast - this is automatic
      }
    }
  }

  async function refreshConfig() {
    await loadMultisigConfig();
  }
</script>

<div class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
    <h2 class="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
      <svg class="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
      </svg>
      Multi-Signature Withdrawal Settings
    </h2>
    <button
      on:click={refreshConfig}
      class="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
      title="Refresh settings"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      Refresh
    </button>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <svg class="animate-spin h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else if walletError || !primaryWallet}
    <div class="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-center">
      <p class="text-yellow-400 text-sm sm:text-base">Wallet Required</p>
      <p class="text-yellow-300 text-xs sm:text-sm mt-1">Please connect your wallet to configure multisig settings.</p>
      <button
        on:click={loadMultisigConfig}
        class="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
      >
        Retry Connection
      </button>
    </div>
  {:else}
    <!-- Info Banner -->
    {#if signers.length > 0 && totalAvailableSigners >= 2}
      <div class="bg-green-900/20 border border-green-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div class="flex items-start gap-2 sm:gap-3">
          <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="flex-1">
            <p class="text-green-300 text-sm sm:text-base font-semibold mb-1">Multi-Signature Active</p>
            <p class="text-green-200 text-xs sm:text-sm">You have {totalAvailableSigners} signer(s) configured. Multi-signature withdrawals are automatically enabled and require {requiredSignatures} signature(s) for approval.</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Enable/Disable Toggle - COMMENTED OUT: Auto-enabled when signers are added -->
    <!--
    <div class="mb-4 sm:mb-6">
      <label for="enable-multisig-toggle" class="flex items-center justify-between cursor-pointer">
        <div class="flex-1">
          <span class="text-white text-sm sm:text-base font-semibold block mb-1">Enable Multi-Signature Withdrawals</span>
          <span class="text-gray-400 text-xs sm:text-sm">
            Require multiple wallet signatures before withdrawals are processed
          </span>
        </div>
        <input
          id="enable-multisig-toggle"
          type="checkbox"
          bind:checked={isEnabled}
          disabled={isLoading || totalAvailableSigners < 2}
          class="sr-only peer"
        />
        <div class="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
      </label>
      {#if isEnabled && totalAvailableSigners < 2}
        <p class="text-red-400 text-xs mt-2">Add at least one signer wallet to enable multisig.</p>
      {/if}
    </div>
    -->

    <!-- Required Signatures -->
    <div class="mb-4 sm:mb-6">
      <label for="required-signatures-input" class="block text-sm sm:text-base font-semibold text-white mb-2">
        Required Signatures
      </label>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <input
          id="required-signatures-input"
          type="number"
          bind:value={requiredSignatures}
          min="1"
          max={totalAvailableSigners}
          disabled={isLoading || totalAvailableSigners < 2}
          class="w-full sm:w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span class="text-gray-400 text-xs sm:text-sm">
          of {totalAvailableSigners} signer{totalAvailableSigners !== 1 ? 's' : ''} (including your primary wallet)
        </span>
      </div>
      {#if requiredSignatures > totalAvailableSigners}
        <p class="text-red-400 text-xs mt-2">Required signatures cannot exceed total signers.</p>
      {/if}
      {#if totalAvailableSigners >= 2}
        <p class="text-gray-400 text-xs mt-2">
          Multi-signature is automatically enabled when signers are added.
        </p>
      {/if}
    </div>

    <!-- Signers List -->
    <div class="mb-4 sm:mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
        <h3 class="text-sm sm:text-base font-semibold text-white">
          Authorized Signers ({signers.length})
        </h3>
        <button
          on:click={() => showAddSignerModal = true}
          class="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Signer
        </button>
      </div>

      <!-- Primary Wallet -->
      <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3 flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 sm:gap-3">
            <span class="text-purple-400 text-xs sm:text-sm font-semibold">Primary</span>
            <span class="text-white text-xs sm:text-sm font-mono truncate">{primaryWallet?.slice(0, 8)}...{primaryWallet?.slice(-6)}</span>
          </div>
        </div>
        <span class="text-gray-400 text-xs sm:text-sm flex-shrink-0 ml-2">Your Wallet</span>
      </div>

      <!-- Additional Signers -->
      {#if signers.length === 0}
        <div class="bg-gray-700/30 rounded-lg p-4 text-center">
          <p class="text-gray-400 text-xs sm:text-sm">No additional signers added yet.</p>
        </div>
      {:else}
        <div class="space-y-2 sm:space-y-3">
          {#each signers as signer (signer.id)}
            <div class="bg-gray-700/50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div class="flex-1 min-w-0">
                {#if signer.wallet_label}
                  <p class="text-white text-xs sm:text-sm font-semibold mb-1">{signer.wallet_label}</p>
                {/if}
                <p class="text-gray-300 text-xs sm:text-sm font-mono truncate">{signer.signer_wallet_address?.slice(0, 8)}...{signer.signer_wallet_address?.slice(-6)}</p>
              </div>
              <button
                on:click={() => removeSigner(signer.signer_wallet_address)}
                disabled={isLoading}
                class="px-3 py-1.5 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if isLoading}
                  <svg class="animate-spin w-3 h-3 sm:w-4 sm:h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                {:else}
                  <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Remove
                {/if}
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Save Button (only show if there are changes to required signatures) -->
    {#if hasChanges && totalAvailableSigners >= 2}
      <button
        on:click={saveMultisigConfig}
        disabled={isLoading || requiredSignatures > totalAvailableSigners || requiredSignatures < 2}
        class="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm sm:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isLoading}
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        {:else}
          Save Changes
        {/if}
      </button>
    {/if}
  {/if}
</div>

{#if showAddSignerModal && primaryWallet}
  <AddSignerWalletModal
    primaryWallet={primaryWallet}
    onSignerAdded={handleSignerAdded}
    onClose={() => showAddSignerModal = false}
  />
{/if}


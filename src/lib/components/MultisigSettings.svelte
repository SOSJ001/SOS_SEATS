<script lang="ts">
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress, signMessageWithWallet } from "$lib/web3";
  import { showToast } from "$lib/store";
  import AddSignerWalletModal from "$lib/components/AddSignerWalletModal.svelte";

  // Props
  export let walletAddress: string | null = null;

  // State
  let isLoading = true;
  let isSaving = false;
  let showAddModal = false;
  let primaryWallet: string | null = null;
  let primaryUserId: string | null = null;
  let walletError = false;

  // Multisig config
  let multisigConfig: {
    config_id: string | null;
    primary_wallet_address: string;
    primary_user_id: string;
    required_signatures: number;
    is_enabled: boolean;
    total_signers: number;
    signers: Array<{
      id: string;
      signer_wallet_address: string;
      wallet_label: string | null;
      is_active: boolean;
      added_at: string;
    }>;
  } | null = null;

  // Local form state
  let isEnabled = false;
  let requiredSignatures = 2;
  let totalAvailableSigners = 1; // Primary wallet counts as 1

  // Load multisig config on mount or when walletAddress changes
  onMount(async () => {
    // If walletAddress prop is provided, use it immediately
    if (walletAddress) {
      primaryWallet = walletAddress;
    }
    await loadMultisigConfig();
  });

  // Set primaryWallet immediately when walletAddress prop is provided
  $: if (walletAddress) {
    if (walletAddress !== primaryWallet) {
      primaryWallet = walletAddress;
      // Load config when wallet changes (but avoid duplicate calls)
      if (primaryWallet && !isLoading) {
        loadMultisigConfig();
      }
    }
  }

  async function loadMultisigConfig() {
    try {
      isLoading = true;

      // Use provided wallet address prop, or try to get it
      let walletToUse = walletAddress;
      
      if (!walletToUse) {
        // Try multiple methods to get wallet address
        // Method 1: Web3 session
        const session = await verifyWeb3Session();
        if (session?.success && session.user?.wallet_address) {
          walletToUse = session.user.wallet_address;
        } else {
          // Method 2: Active wallet from extension
          walletToUse = getActiveWalletAddress();
          
          // Method 3: Try to get from window.solana directly
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

      if (error && error.code !== "P0001") {
        // P0001 = no rows returned, which is fine for new configs
        console.error("Error loading multisig config:", error);
        showToast("error", "Error", "Failed to load multisig settings.");
      }

      // Load signers using RPC function to bypass RLS issues with Web3 users
      let activeSigners: any[] = [];
      let signerCount = 1; // Default to just primary wallet
      
      const { data: signersData, error: signersError } = await supabase.rpc("get_multisig_signers", {
        p_wallet_address: primaryWallet,
      });

      if (signersError) {
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
        // Always use fresh signers from database, but prefer RPC config.total_signers if available
        const finalSignerCount = Math.max(
          config.total_signers || signerCount,
          signerCount // Ensure we use the actual current count
        );
        
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

        isEnabled = multisigConfig.is_enabled;
        requiredSignatures = multisigConfig.required_signatures;
        totalAvailableSigners = finalSignerCount;
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
        } else {
          multisigConfig = null;
        }
        isEnabled = false;
        requiredSignatures = 2;
        totalAvailableSigners = signerCount;
      }
    } catch (err) {
      console.error("Error in loadMultisigConfig:", err);
      showToast("error", "Error", "Failed to load multisig settings.");
    } finally {
      isLoading = false;
    }
  }

  async function saveMultisigConfig() {
    // Ensure we have the latest wallet address - prioritize prop
    let walletToUse = walletAddress || primaryWallet;
    
    if (!walletToUse) {
      // Try to get it one more time
      const session = await verifyWeb3Session();
      walletToUse = session?.success && session.user?.wallet_address
        ? session.user.wallet_address
        : getActiveWalletAddress();
      
      // Also try window directly
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
      
      if (walletToUse) {
        primaryWallet = walletToUse;
      }
    } else {
      // Update primaryWallet if prop was used
      if (walletToUse !== primaryWallet) {
        primaryWallet = walletToUse;
      }
    }

    if (!primaryWallet) {
      showToast(
        "error",
        "Wallet Required",
        "Please connect your wallet to configure multisig. Wallet address could not be found."
      );
      return;
    }

    // Ensure we have user ID - prioritize web3_users lookup
    let userIdToUse = primaryUserId;
    
    if (!userIdToUse && primaryWallet) {
      // First try web3_users table (most reliable)
      const { data: web3User } = await supabase
        .from("web3_users")
        .select("id")
        .eq("wallet_address", primaryWallet)
        .maybeSingle();
      
      if (web3User?.id) {
        userIdToUse = web3User.id;
      }
    }
    
    // Fallback to auth session
    if (!userIdToUse) {
      const { data: sessionData } = await supabase.auth.getSession();
      userIdToUse = sessionData?.session?.user?.id || null;
    }
    
    // Fallback to Web3 session
    if (!userIdToUse) {
      const session = await verifyWeb3Session();
      if (session?.success && session.user?.id) {
        userIdToUse = session.user.id;
      }
    }
    
    if (userIdToUse) {
      primaryUserId = userIdToUse;
    }

    if (!primaryUserId) {
      showToast(
        "error",
        "User ID Required",
        "Could not find user ID for this wallet. Please try refreshing the page."
      );
      return;
    }

    // Validate required signatures doesn't exceed available signers
    if (isEnabled && requiredSignatures > totalAvailableSigners) {
      showToast(
        "error",
        "Invalid Configuration",
        `Required signatures (${requiredSignatures}) cannot exceed available signers (${totalAvailableSigners}). Add more signers first.`
      );
      return;
    }

    // Validate required signatures - must be at least 2 and not exceed available
    if (isEnabled) {
      if (totalAvailableSigners < 2) {
        showToast(
          "error",
          "Invalid Configuration",
          "You need at least 2 signers (including your primary wallet) to enable multisig. Please add at least 1 additional signer wallet and refresh."
        );
        return;
      }
      
      if (requiredSignatures < 2) {
        showToast(
          "error",
          "Invalid Configuration",
          "Multisig requires at least 2 signatures when enabled."
        );
        return;
      }
      
      if (requiredSignatures > totalAvailableSigners) {
        showToast(
          "error",
          "Invalid Configuration",
          `Required signatures (${requiredSignatures}) cannot exceed available signers (${totalAvailableSigners}). Please adjust the required signatures first.`
        );
        return;
      }
    }

    try {
      isSaving = true;

      const { data, error } = await supabase.rpc("upsert_multisig_config", {
        p_primary_wallet_address: primaryWallet,
        p_primary_user_id: primaryUserId,
        p_required_signatures: requiredSignatures,
        p_is_enabled: isEnabled,
      });

      if (error) {
        showToast("error", "Error", error.message || "Failed to save multisig settings.");
        return;
      }

      if (data && data.length > 0 && data[0].success) {
        showToast("success", "Saved", data[0].message || "Multisig settings saved successfully.");
        await loadMultisigConfig(); // Reload to get updated config
      } else {
        showToast("error", "Error", "Failed to save multisig settings.");
      }
    } catch (err) {
      console.error("Error in saveMultisigConfig:", err);
      showToast("error", "Error", "Failed to save multisig settings.");
    } finally {
      isSaving = false;
    }
  }

  async function removeSigner(signerWalletAddress: string) {
    if (!primaryWallet) return;

    try {
      const { data, error } = await supabase.rpc("remove_multisig_signer", {
        p_primary_wallet_address: primaryWallet,
        p_signer_wallet_address: signerWalletAddress,
      });

      if (error) {
        console.error("Error removing signer:", error);
        showToast("error", "Error", error.message || "Failed to remove signer.");
        return;
      }

      if (data && data.length > 0 && data[0].success) {
        showToast("success", "Signer Removed", data[0].message || "Signer removed successfully.");
        await loadMultisigConfig(); // Reload to get updated config
      }
    } catch (err) {
      console.error("Error in removeSigner:", err);
      showToast("error", "Error", "Failed to remove signer.");
    }
  }

  async function handleSignerAdded() {
    showAddModal = false;
    
    // Retry loading config with exponential backoff to ensure DB update is committed
    let retries = 3;
    let delay = 800; // Start with 800ms
    
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Force reload config to get updated signers
      await loadMultisigConfig();
      
      // Check if signers are now loaded
      if (multisigConfig && multisigConfig.signers && multisigConfig.signers.length > 0) {
        break; // Success - signers loaded
      }
      
      retries--;
      delay *= 1.5; // Exponential backoff
    }
    
    // Force UI update - ensure signers are visible
    if (multisigConfig) {
      // Recalculate total from actual signers
      const actualTotal = (multisigConfig.signers?.length || 0) + 1; // +1 for primary
      totalAvailableSigners = Math.max(totalAvailableSigners, actualTotal);
      multisigConfig.total_signers = totalAvailableSigners;
      
      // Ensure required signatures doesn't exceed available
      if (isEnabled && requiredSignatures > totalAvailableSigners) {
        requiredSignatures = Math.max(2, totalAvailableSigners);
      }
      
      // If still no signers after retries, show a message
      if (multisigConfig.signers.length === 0) {
        showToast(
          "warning",
          "Signer Added",
          "Signer was added but may take a moment to appear. Click refresh to reload."
        );
      }
    }
  }
  
  async function refreshConfig() {
    await loadMultisigConfig();
  }

  // Update total available signers when multisigConfig changes
  $: if (multisigConfig) {
    const newTotal = multisigConfig.total_signers || (multisigConfig.signers?.length || 0) + 1;
    if (totalAvailableSigners !== newTotal) {
      totalAvailableSigners = newTotal;
    }
  }

  // Update required signatures max when signers change
  $: if (isEnabled && requiredSignatures > totalAvailableSigners && totalAvailableSigners > 0) {
    requiredSignatures = Math.max(2, totalAvailableSigners);
  }
</script>

<div class="bg-gray-800 rounded-lg p-4 sm:p-6">
  <h2
    class="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center"
  >
    <svg
      class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
    Multi-Signature Withdrawals
  </h2>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <svg
        class="animate-spin h-8 w-8 text-purple-400"
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
  {:else if walletError || !primaryWallet}
    <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <svg
        class="w-12 h-12 text-red-400 mx-auto mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="text-red-400 font-semibold mb-2">Wallet Required</h3>
      <p class="text-gray-300 text-sm mb-4">
        Please connect your wallet to configure multisig settings.
      </p>
      <button
        on:click={refreshConfig}
        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
      >
        Retry Connection
      </button>
    </div>
  {:else}
    <div class="space-y-4 sm:space-y-6">
      <!-- Show info if signers exist but config doesn't -->
      {#if multisigConfig && !multisigConfig.config_id && multisigConfig.signers.length > 0}
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-blue-400 font-semibold text-sm mb-1">Signers Found</p>
              <p class="text-gray-300 text-xs">
                You have {multisigConfig.signers.length} signer(s) configured. Enable multi-signature below to activate them.
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Enable/Disable Toggle -->
      <div
        class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700"
      >
        <div class="mb-2 sm:mb-0">
          <span class="text-gray-300 text-sm sm:text-base block mb-1"
            >Enable Multi-Signature</span
          >
          <span class="text-gray-500 text-xs"
            >Require multiple wallet signatures for withdrawals</span
          >
        </div>
        <label class="relative inline-flex items-center cursor-pointer mt-2 sm:mt-0">
          <input
            type="checkbox"
            bind:checked={isEnabled}
            class="sr-only peer"
          />
          <div
            class="w-10 h-6 sm:w-11 sm:h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
          ></div>
        </label>
      </div>

      {#if isEnabled || (multisigConfig && multisigConfig.signers.length > 0)}
        <!-- Required Signatures -->
        <div
          class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700"
        >
          <div class="mb-2 sm:mb-0">
            <span class="text-gray-300 text-sm sm:text-base block mb-1"
              >Required Signatures</span
            >
            <span class="text-gray-500 text-xs"
              >How many signatures needed to execute a withdrawal</span
            >
          </div>
          <div class="flex items-center gap-2 mt-2 sm:mt-0">
            <input
              type="number"
              bind:value={requiredSignatures}
              min="2"
              max={totalAvailableSigners}
              class="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <span class="text-gray-400 text-sm">of {totalAvailableSigners}</span>
          </div>
        </div>

        <!-- Authorized Signers List -->
        <div class="py-3 border-b border-gray-700">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-300 text-sm sm:text-base"
              >Authorized Signers</span
            >
            <div class="flex items-center gap-2">
              <button
                on:click={refreshConfig}
                class="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors flex items-center gap-1"
                title="Refresh signers list"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                on:click={() => (showAddModal = true)}
                class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center gap-1"
              >
                <svg
                  class="w-4 h-4"
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
                Add Signer
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <!-- Primary Wallet (always shown) -->
            <div
              class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-green-500/30"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <div class="text-white text-sm font-medium">
                    {primaryWallet
                      ? `${primaryWallet.slice(0, 8)}...${primaryWallet.slice(-6)}`
                      : "Your Wallet"}
                  </div>
                  <div class="text-gray-400 text-xs">Primary Wallet (always included)</div>
                </div>
              </div>
              <span
                class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded"
              >
                Active
              </span>
            </div>

            <!-- Additional Signers -->
            {#if multisigConfig && multisigConfig.signers.length > 0}
              {#each multisigConfig.signers as signer (signer.id)}
                {#if signer.is_active}
                  <div
                    class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                  >
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <svg
                        class="w-5 h-5 text-purple-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <div class="flex-1 min-w-0">
                        <div class="text-white text-sm font-medium truncate">
                          {signer.signer_wallet_address.slice(0, 8)}...{signer.signer_wallet_address.slice(-6)}
                        </div>
                        <div class="text-gray-400 text-xs">
                          {signer.wallet_label || "No label"}
                        </div>
                      </div>
                    </div>
                    <button
                      on:click={() => removeSigner(signer.signer_wallet_address)}
                      class="ml-3 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-sm transition-colors flex-shrink-0"
                      title="Remove signer"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                {/if}
              {/each}
            {:else}
              <div class="text-gray-500 text-sm text-center py-4">
                No additional signers added yet.
                <button
                  on:click={() => (showAddModal = true)}
                  class="text-purple-400 hover:text-purple-300 underline ml-1"
                >
                  Add one now
                </button>
              </div>
            {/if}
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end pt-2">
          <button
            on:click={saveMultisigConfig}
            disabled={isSaving}
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {#if isSaving}
              <svg
                class="animate-spin h-4 w-4"
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
              Saving...
            {:else}
              {multisigConfig && !multisigConfig.config_id ? "Create & Save Settings" : "Save Settings"}
            {/if}
          </button>
        </div>
      {:else if multisigConfig && multisigConfig.signers.length > 0}
        <!-- Show signers even if not enabled, but prompt to enable -->
        <div class="py-3 border-b border-gray-700">
          <div class="flex justify-between items-center mb-3">
            <span class="text-gray-300 text-sm sm:text-base"
              >Authorized Signers</span
            >
            <div class="flex items-center gap-2">
              <button
                on:click={refreshConfig}
                class="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors flex items-center gap-1"
                title="Refresh signers list"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                on:click={() => (showAddModal = true)}
                class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center gap-1"
              >
                <svg
                  class="w-4 h-4"
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
                Add Signer
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <!-- Primary Wallet (always shown) -->
            <div
              class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-green-500/30"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <div class="text-white text-sm font-medium">
                    {primaryWallet
                      ? `${primaryWallet.slice(0, 8)}...${primaryWallet.slice(-6)}`
                      : "Your Wallet"}
                  </div>
                  <div class="text-gray-400 text-xs">Primary Wallet (always included)</div>
                </div>
              </div>
              <span
                class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded"
              >
                Active
              </span>
            </div>

            <!-- Additional Signers -->
            {#each multisigConfig.signers as signer (signer.id)}
              {#if signer.is_active}
                <div
                  class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <svg
                      class="w-5 h-5 text-purple-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <div class="text-white text-sm font-medium truncate">
                        {signer.signer_wallet_address.slice(0, 8)}...{signer.signer_wallet_address.slice(-6)}
                      </div>
                      <div class="text-gray-400 text-xs">
                        {signer.wallet_label || "No label"}
                      </div>
                    </div>
                  </div>
                  <button
                    on:click={() => removeSigner(signer.signer_wallet_address)}
                    class="ml-3 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-sm transition-colors flex-shrink-0"
                    title="Remove signer"
                  >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        </div>

        <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p class="text-yellow-400 text-sm mb-2">Multi-signature is disabled</p>
          <p class="text-gray-300 text-xs mb-3">Enable multi-signature above and save to activate your signers.</p>
          <button
            on:click={() => {
              isEnabled = true;
              saveMultisigConfig();
            }}
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Enable & Save
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if showAddModal}
  <AddSignerWalletModal
    primaryWallet={primaryWallet}
    onSignerAdded={handleSignerAdded}
    onClose={() => (showAddModal = false)}
  />
{/if}


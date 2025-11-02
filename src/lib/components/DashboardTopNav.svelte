<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import WalletConnectButton from "./WalletConnectButton.svelte";
  import { onMount } from "svelte";
  import { supabase, verifyWeb3Session } from "$lib/supabase";
  import { getActiveWalletAddress } from "$lib/web3";
  import { goto } from "$app/navigation";

  export let userName = "User";
  export let onMenuToggle = () => {}; // Function to toggle sidebar

  let showNotifications = false;
  let notifications: any[] = [];
  let isLoadingNotifications = false;
  let unreadCount = 0;
  let isCheckingPendingNotifications = false; // Flag to prevent recursive calls

  // Format time ago
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    return "Just now";
  }

  // Ensure notifications exist for pending withdrawals that need signers
  async function ensurePendingWithdrawalNotifications(currentWallet: string) {
    // Prevent recursive calls
    if (isCheckingPendingNotifications) {
      return;
    }
    isCheckingPendingNotifications = true;
    
    try {
      // Find all pending withdrawals where this wallet is a potential signer
      // Use the security definer function to bypass RLS
      const { data: signerConfigs, error: signerError } = await supabase.rpc(
        "get_multisig_signers_by_signer_wallet",
        {
          p_signer_wallet_address: currentWallet,
        }
      );

      if (signerError) {
        console.error("Error fetching signer configs:", signerError);
        return;
      }

      if (!signerConfigs || signerConfigs.length === 0) {
        return;
      }
      const primaryWallets = (signerConfigs || []).map((c: any) => c.primary_wallet_address);

      // Find pending withdrawals for these primary wallets
      const { data: pendingWithdrawals, error: withdrawalError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .in("wallet_address", primaryWallets)
        .eq("type", "withdrawal")
        .eq("status", "pending_approval")
        .eq("multisig_enabled", true);

      if (withdrawalError) {
        console.error("Error fetching pending withdrawals:", withdrawalError);
        return;
      }

      if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
        return;
      }

      let notificationsCreated = 0;

      // Check each pending withdrawal and create notifications if needed
      for (const withdrawal of pendingWithdrawals) {
        // Check if withdrawal is expired
        if (withdrawal.expires_at && new Date(withdrawal.expires_at) < new Date()) {
          continue;
        }

        // Check if this wallet has already signed
        const collectedSignatures = withdrawal.collected_signatures || [];
        const hasSigned = collectedSignatures.some((sig: any) => sig.wallet === currentWallet);

        if (hasSigned) {
          continue;
        }

        // Check if notification already exists (regardless of read status)
        const { data: existingNotifications, error: notifCheckError } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_wallet_address", currentWallet)
          .eq("action_url", `/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`)
          .limit(1);

        if (notifCheckError) {
          console.error("Error checking existing notifications:", notifCheckError);
          continue;
        }

        if (existingNotifications && existingNotifications.length > 0) {
          continue;
        }

        // Create notification for this pending withdrawal
        const metadata = withdrawal.metadata || {};
        const finalAmount = metadata.final_net_amount || Math.abs(withdrawal.amount);
        const currency = withdrawal.currency || "NLe";
        const phoneNumber = metadata.phone_number || "N/A";

        const { data: notificationData, error: insertError } = await supabase.rpc(
          "create_notification",
          {
            p_user_wallet_address: currentWallet,
            p_title: "Withdrawal Signature Required",
            p_message: `A withdrawal of ${currency} ${finalAmount.toFixed(2)} to ${phoneNumber} needs your signature.`,
            p_type: "warning",
            p_action_url: `/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`,
            p_is_read: false,
          }
        );

        if (insertError) {
          console.error("Error creating notification:", insertError);
        } else {
          notificationsCreated++;
        }
      }

      if (notificationsCreated > 0) {
        // Only reload once after all notifications are created, not inside the loop
        // Use a flag to prevent recursive reloads
        // Don't reload if notifications panel is open (user might be clicking)
        setTimeout(() => {
          isCheckingPendingNotifications = false; // Reset flag before reload
          if (!isLoadingNotifications && !showNotifications) {
            loadNotifications();
          }
        }, 1000); // Increased delay to reduce blinking
      } else {
        isCheckingPendingNotifications = false; // Reset flag if no notifications created
      }
    } catch (err) {
      console.error("Error ensuring pending withdrawal notifications:", err);
      isCheckingPendingNotifications = false; // Reset flag on error
    }
  }

  // Load notifications from database
  async function loadNotifications() {
    // Prevent multiple simultaneous loads
    if (isLoadingNotifications) {
      return;
    }
    isLoadingNotifications = true;
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
        notifications = [];
        unreadCount = 0;
        return;
      }

      // First, ensure notifications exist for pending withdrawals (only if not already checking and panel is closed)
      if (!isCheckingPendingNotifications && !showNotifications) {
        await ensurePendingWithdrawalNotifications(wallet);
      }

      // Fetch notifications for this wallet using security definer function
      const { data, error } = await supabase.rpc("get_notifications_for_wallet", {
        p_user_wallet_address: wallet,
        p_limit: 20,
      });

      if (error) {
        console.error("Error loading notifications:", error);
        notifications = [];
        unreadCount = 0;
        return;
      }


      notifications = (data || []).map((n: any) => ({
        id: n.id,
        message: n.message,
        title: n.title,
        time: formatTimeAgo(new Date(n.created_at)),
        is_read: n.is_read,
        action_url: n.action_url,
        type: n.type,
      }));

      unreadCount = notifications.filter((n) => !n.is_read).length;
    } catch (err) {
      console.error("Error in loadNotifications:", err);
      notifications = [];
      unreadCount = 0;
    } finally {
      isLoadingNotifications = false;
    }
  }

  // Mark notification as read and navigate
  async function handleNotificationClick(notification: any) {
    if (!notification.is_read) {
      // Mark as read using RPC function
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
          console.error("No wallet address available");
        } else {
          const { data, error } = await supabase.rpc("mark_notification_as_read", {
            p_notification_id: notification.id,
            p_user_wallet_address: wallet,
          });

          if (error) {
            console.error("Error marking notification as read:", error);
          } else if (data && data.length > 0 && data[0].success) {
            // Update local state immediately
            notification.is_read = true;
            // Update the notifications array to ensure reactive updates
            notifications = notifications.map((n: any) => 
              n.id === notification.id ? { ...n, is_read: true } : n
            );
            unreadCount = Math.max(0, unreadCount - 1);
          }
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      goto(notification.action_url);
      showNotifications = false;
    }
  }

  onMount(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds (but skip if panel is open to avoid blinking)
    const interval = setInterval(() => {
      if (!showNotifications && !isLoadingNotifications) {
        loadNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  });
</script>

<div
  class="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between"
>
  <!-- Left side - hamburger menu and page title -->
  <div class="flex items-center space-x-4">
    <!-- Hamburger Menu Button (Mobile) -->
    <button
      on:click={onMenuToggle}
      class="lg:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200"
      aria-label="Toggle menu"
    >
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <h1 class="text-white text-xl font-semibold">Dashboard</h1>
  </div>

  <!-- Right side - wallet, notifications, profile -->
  <div class="flex items-center space-x-6">
    <!-- Wallet Connect Button -->
    <WalletConnectButton />

    <!-- Notifications -->
    <div class="relative hidden lg:block">
      <button
        on:click={() => (showNotifications = !showNotifications)}
        class="relative p-2 text-gray-300 hover:text-white transition-colors duration-200"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
          />
        </svg>
        {#if unreadCount > 0}
          <span
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount}
          </span>
        {/if}
      </button>

      {#if showNotifications}
        <div
          class="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
          transition:fly={{ y: -10, duration: 200 }}
        >
          <div class="p-4 border-b border-gray-700">
            <h3 class="text-white font-semibold">Notifications</h3>
          </div>
          <div class="max-h-64 overflow-y-auto">
            {#if isLoadingNotifications}
              <div class="p-4 text-center text-gray-400 text-sm">Loading...</div>
            {:else if notifications.length === 0}
              <div class="p-4 text-center text-gray-400 text-sm">No notifications</div>
            {:else}
              {#each notifications as notification}
                <button
                  on:click={() => handleNotificationClick(notification)}
                  class="w-full text-left p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition-colors duration-200 {notification.is_read ? '' : 'bg-gray-800/50'}"
                >
                  <div class="flex items-start gap-2">
                    <div class="flex-1">
                      <p class="text-white text-sm font-semibold mb-1">{notification.title}</p>
                      <p class="text-gray-300 text-sm">{notification.message}</p>
                      <p class="text-gray-500 text-xs mt-1">{notification.time}</p>
                    </div>
                    {#if !notification.is_read}
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    {/if}
                  </div>
                </button>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- User Profile -->
    <div class="hidden lg:flex items-center space-x-3">
      <div
        class="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center"
      >
        <span class="text-white font-semibold text-sm">
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div class="hidden md:block">
        <p class="text-white font-medium text-sm">Hi, {userName}</p>
      </div>
    </div>
  </div>
</div>

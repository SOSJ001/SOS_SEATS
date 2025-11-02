<script lang="ts">
  import { page } from "$app/stores";
  import { signOutbtnFunction, supabase, verifyWeb3Session } from "$lib/supabase";
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  import { getActiveWalletAddress } from "$lib/web3";
  import { goto } from "$app/navigation";

  export let onClose = undefined; // Optional close handler for mobile
  export let userName = "User"; // User name for mobile display
  // export let walletBalance = "$1,234.56"; // Wallet balance for mobile display

  $: activeUrl = $page.url.pathname;

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

  let routes = [
    {
      icon: "home",
      name: "Dashboard",
      url: "/dashboard",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>`,
    },
    {
      icon: "calendar",
      name: "Events",
      url: "/dashboard/events",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>`,
    },
    {
      icon: "ticket",
      name: "My Tickets",
      url: "/dashboard/my-tickets",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z"/></svg>`,
    },
    {
      icon: "store",
      name: "Marketplace",
      url: "/marketplace",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
    },
    {
      icon: "users",
      name: "Guests",
      url: "/dashboard/guests",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    },
    {
      icon: "qr-code",
      name: "Scanner",
      url: "/dashboard/scanner",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd"/></svg>`,
    },
    {
      icon: "chair",
      name: "Seats",
      url: "/dashboard/seats",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>`,
    },
    {
      icon: "wallet",
      name: "Wallet",
      url: "/dashboard/wallet",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/></svg>`,
    },
    // {
    //   icon: "user",
    //   name: "Profile",
    //   url: "/dashboard/profile",
    //   svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>`,
    // },
    {
      icon: "settings",
      name: "Settings",
      url: "/dashboard/settings",
      svg: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>`,
    },
  ];

  let logout = async () => {
    await signOutbtnFunction();
    const response = await fetch("/logoutApi", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    window.location.href = "/";
  };
</script>

<div
  class="w-64 h-screen bg-gray-900 border-r border-gray-700 flex flex-col relative overflow-y-auto"
>
  <!-- Close button for mobile -->
  {#if onClose}
    <button
      class="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-800 text-gray-300 hover:text-white lg:hidden"
      on:click={onClose}
      aria-label="Close sidebar"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  {/if}

  <!-- Logo Section -->
  <div class="p-6 border-b border-gray-700">
    <div class="flex items-center space-x-3">
      <div
        class="text-xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent select-none"
        style="font-family: 'Roboto Slab', serif;"
      >
        SOS SEATS
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
    {#each routes as route, index}
      <a
        href={route.url}
        class="flex items-center px-4 py-3 text-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-800 hover:text-white group {activeUrl ===
        route.url
          ? 'bg-gray-800 text-white border-l-4 border-teal-400'
          : ''}"
        in:fade={{ duration: 200, delay: index * 50 }}
      >
        <span
          class="mr-3 group-hover:text-teal-400 transition-colors duration-200"
        >
          {@html route.svg}
        </span>
        <span class="font-medium">{route.name}</span>
      </a>
    {/each}
  </nav>

  <!-- Mobile User Profile & Notifications -->
  <div class="lg:hidden p-4 border-t border-gray-700 space-y-4">
    <!-- User Profile -->
    <div class="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
      <div
        class="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center"
      >
        <span class="text-white font-semibold text-sm">
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div class="flex-1">
        <p class="text-white font-medium text-sm">Hi, {userName}</p>
        <!-- <p class="text-gray-400 text-xs">{walletBalance}</p> -->
      </div>
    </div>

    <!-- Notifications -->
    <div class="relative">
      <button
        on:click={() => (showNotifications = !showNotifications)}
        class="flex items-center w-full p-3 text-gray-300 hover:text-white transition-colors duration-200 bg-gray-800 rounded-lg"
      >
        <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
          />
        </svg>
        <span class="font-medium">Notifications</span>
        {#if unreadCount > 0}
          <span
            class="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount}
          </span>
        {/if}
      </button>

      {#if showNotifications}
        <div
          class="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          transition:fly={{ y: 10, duration: 200 }}
        >
          <div class="p-3 border-b border-gray-700">
            <h3 class="text-white font-semibold text-sm">
              Recent Notifications
            </h3>
          </div>
          <div class="max-h-32 overflow-y-auto">
            {#if isLoadingNotifications}
              <div class="p-3 text-center text-gray-400 text-xs">Loading...</div>
            {:else if notifications.length === 0}
              <div class="p-3 text-center text-gray-400 text-xs">No notifications</div>
            {:else}
              {#each notifications as notification}
                {#if notification.is_read}
                  <div
                    class="w-full text-left p-3 border-b border-gray-700 last:border-b-0 transition-colors duration-200 opacity-75 cursor-default"
                  >
                    <div class="flex items-start gap-2">
                      <div class="flex-1">
                        <p class="text-gray-400 text-xs font-semibold mb-1">{notification.title}</p>
                        <p class="text-gray-500 text-xs">{notification.message}</p>
                        <p class="text-gray-600 text-xs mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                {:else}
                  <button
                    on:click={() => handleNotificationClick(notification)}
                    class="w-full text-left p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition-colors duration-200 bg-gray-800/50 cursor-pointer"
                  >
                    <div class="flex items-start gap-2">
                      <div class="flex-1">
                        <p class="text-white text-xs font-semibold mb-1">{notification.title}</p>
                        <p class="text-gray-300 text-xs">{notification.message}</p>
                        <p class="text-gray-500 text-xs mt-1">{notification.time}</p>
                      </div>
                      <div class="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                    </div>
                  </button>
                {/if}
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Logout -->
  <div class="p-4 border-t border-gray-700">
    <button
      on:click={logout}
      class="flex items-center px-4 py-3 text-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-800 hover:text-white w-full group"
    >
      <span
        class="mr-3 group-hover:text-red-400 transition-colors duration-200"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
      <span class="font-medium">Logout</span>
    </button>
  </div>
</div>

<style>
  /* Custom scrollbar styling for better UX */
  div::-webkit-scrollbar {
    width: 6px;
  }

  div::-webkit-scrollbar-track {
    background: #374151;
  }

  div::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 3px;
  }

  div::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  /* Firefox scrollbar */
  div {
    scrollbar-width: thin;
    scrollbar-color: #6b7280 #374151;
  }
</style>

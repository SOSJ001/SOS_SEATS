<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabase";
  import { fade, fly } from "svelte/transition";

  export let data;

  let tickets = [];
  let loading = true;
  let error = null;
  let selectedTicket = null;
  let showAssignmentModal = false;
  let showQRModal = false;
  let walletAddress = "";
  let assigning = false;
  let debugInfo = {};
  let showDebug = false;

  onMount(async () => {
    console.log("�� Component mounted, server data:", data);
    await loadTickets();
  });

  async function loadTickets() {
    try {
      loading = true;
      error = null;

      // Initialize debug info
      debugInfo = {
        serverData: data || {},
        walletFromServer: null,
        sessionType: null,
        finalWalletAddress: null,
        ordersFound: 0,
        ticketsFound: 0,
      };

      // Get wallet address from server-side data
      let userWalletAddress = null;

      // Safely access server data
      if (data && data.walletAddress) {
        userWalletAddress = data.walletAddress;
        debugInfo.walletFromServer = userWalletAddress;
        debugInfo.sessionType = data.sessionType;
      }

      console.log("🔍 Debug Info:", debugInfo);

      // If no wallet address from server, try client-side fallback
      if (!userWalletAddress) {
        // Try to get from web3Session cookie
        const web3SessionCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("web3Session="));

        if (web3SessionCookie) {
          try {
            const sessionData = JSON.parse(
              decodeURIComponent(web3SessionCookie.split("=")[1])
            );
            console.log("🔍 Client-side session data:", sessionData);
            if (sessionData.type === "web3" && sessionData.wallet_address) {
              userWalletAddress = sessionData.wallet_address;
            }
          } catch (parseError) {
            console.error("❌ Error parsing web3Session:", parseError);
          }
        }
      }

      debugInfo.finalWalletAddress = userWalletAddress;
      console.log("🎯 Final wallet address:", userWalletAddress);

      if (!userWalletAddress) {
        error = "No wallet address found. Please connect your wallet.";
        return;
      }

      // Use the bypass function to fetch tickets (bypasses RLS)
      const { data: ordersData, error: fetchError } = await supabase.rpc(
        "load_orders_by_wallet",
        { p_wallet_address: userWalletAddress }
      );

      if (fetchError) throw fetchError;

      debugInfo.ordersFound = ordersData?.length || 0;

      // Transform the data to match the expected format
      tickets =
        ordersData?.map((order) => ({
          id: `ticket-${order.order_id}`,
          event_id: order.event_id,
          wallet_address: order.buyer_wallet_address,
          ticket_number: `TIX-${order.order_id.slice(0, 8)}`,
          status: "confirmed",
          orderId: order.order_id,
          orderDate: order.created_at,
          totalAmount: order.total_amount,
          orderStatus: order.order_status,
          paymentMethod: order.payment_method,
          ticketType: order.ticket_type_name || "Standard",
          price: order.ticket_type_price || 0,
          source: order.payment_method === "free" ? "free" : "paid",
          events: {
            title: order.event_name,
            description: "Event description",
            date: order.event_date,
            location: order.event_location,
          },
        })) || [];

      debugInfo.ticketsFound = tickets.length;
      console.log("✅ Loaded tickets:", tickets);
    } catch (err) {
      console.error("❌ Error loading tickets:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function assignTicketToWallet(ticketId, walletAddress) {
    try {
      assigning = true;

      const { error: updateError } = await supabase
        .from("guests")
        .update({ wallet_address: walletAddress })
        .eq("id", ticketId);

      if (updateError) throw updateError;

      // Refresh the tickets list
      await loadTickets();
      showAssignmentModal = false;
      selectedTicket = null;
      walletAddress = "";
    } catch (err) {
      error = err.message;
    } finally {
      assigning = false;
    }
  }

  function openAssignmentModal(ticket) {
    selectedTicket = ticket;
    walletAddress = ticket.wallet_address || "";
    showAssignmentModal = true;
  }

  function openQRModal(ticket) {
    selectedTicket = ticket;
    showQRModal = true;
  }

  function generateQRCode(walletAddress) {
    // This would generate a QR code containing the wallet address
    // For now, we'll just return the wallet address as text
    return walletAddress;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      console.log("✅ Copied to clipboard:", text);
    } catch (err) {
      console.error("❌ Failed to copy:", err);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "confirmed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "checked-in":
        return "text-blue-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case "confirmed":
        return "✓";
      case "pending":
        return "⏳";
      case "checked-in":
        return "🎫";
      case "cancelled":
        return "❌";
      default:
        return "❓";
    }
  }
</script>

<svelte:head>
  <title>My Tickets - SOS SEATS</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">My Tickets</h1>
        <p class="text-gray-400">
          Manage your purchased tickets and assign them to wallet addresses
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          on:click={() => (showDebug = !showDebug)}
          class="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          {showDebug ? "Hide" : "Show"} Debug
        </button>
        <button
          on:click={loadTickets}
          class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  </div>

  <!-- Debug Information -->
  {#if showDebug}
    <div class="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 class="text-white font-medium mb-2">Debug Information</h3>
      <div class="text-sm text-gray-400 space-y-1">
        <p>Session Type: {debugInfo.sessionType || "Unknown"}</p>
        <p>
          Wallet from Server: {debugInfo.walletFromServer
            ? "Found"
            : "Not found"}
        </p>
        <p>
          Final Wallet: {debugInfo.finalWalletAddress ? "Found" : "Not found"}
        </p>
        <p>Orders Found: {debugInfo.ordersFound || 0}</p>
        <p>Tickets Found: {debugInfo.ticketsFound || 0}</p>
        <p>Current Error: {error || "None"}</p>
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
        ></div>
        <p class="text-gray-400">Loading your tickets...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="bg-red-900 border border-red-700 rounded-lg p-6 text-center">
      <div
        class="w-16 h-16 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="text-red-200 text-2xl">⚠️</span>
      </div>
      <h3 class="text-red-200 text-lg font-semibold mb-2">
        Unable to Load Tickets
      </h3>
      <p class="text-red-300 mb-4">{error}</p>
      <button
        on:click={loadTickets}
        class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  {:else if tickets.length === 0}
    <!-- Empty State -->
    <div class="text-center py-12">
      <div
        class="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4"
      >
        <span class="text-gray-400 text-3xl">🎫</span>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">No tickets found</h3>
      <p class="text-gray-400 mb-6">
        {debugInfo.finalWalletAddress
          ? "You haven't purchased any tickets with this wallet yet."
          : "Connect your wallet to see your purchased tickets."}
      </p>
      <a
        href="/marketplace"
        class="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
      >
        <span class="mr-2">🎪</span>
        Browse Events
      </a>
    </div>
  {:else}
    <!-- Tickets List -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">
          Your Tickets ({tickets.length})
        </h2>
      </div>

      {#each tickets as ticket (ticket.id)}
        <div
          class="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors relative overflow-hidden"
          in:fly={{ y: 20, duration: 300 }}
        >
          <!-- Status Badge -->
          <div class="absolute top-4 right-4">
            <span
              class="px-3 py-1 rounded-full text-xs font-medium {getStatusBadge(
                ticket.status
              )}"
            >
              <span class="mr-1">{getStatusIcon(ticket.status)}</span>
              {ticket.status}
            </span>
          </div>

          <!-- Ticket Header -->
          <div class="mb-6">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-white mb-2">
                  {ticket.events?.title || "Event Title"}
                </h3>
                <p class="text-gray-400 text-sm mb-3">
                  {ticket.events?.description ||
                    "Event description not available"}
                </p>
              </div>
            </div>

            <!-- Ticket Details Grid -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div class="bg-gray-900/50 p-3 rounded-lg">
                <div class="text-gray-400 text-xs mb-1">Ticket Type</div>
                <div class="text-white font-medium flex items-center">
                  <span class="mr-2">🎫</span>
                  {ticket.ticketType || "Standard"}
                </div>
              </div>

              <div class="bg-gray-900/50 p-3 rounded-lg">
                <div class="text-gray-400 text-xs mb-1">Price</div>
                <div class="text-white font-medium flex items-center">
                  <span class="mr-2">💰</span>
                  ${ticket.price || "0.00"}
                </div>
              </div>

              <div class="bg-gray-900/50 p-3 rounded-lg">
                <div class="text-gray-400 text-xs mb-1">Order Date</div>
                <div class="text-white font-medium flex items-center">
                  <span class="mr-2">📅</span>
                  {new Date(ticket.orderDate).toLocaleDateString()}
                </div>
              </div>

              <div class="bg-gray-900/50 p-3 rounded-lg">
                <div class="text-gray-400 text-xs mb-1">Ticket ID</div>
                <div class="text-white font-medium flex items-center">
                  <span class="mr-2">🆔</span>
                  {ticket.id?.slice(0, 8) || "N/A"}
                </div>
              </div>

              <div class="bg-gray-900/50 p-3 rounded-lg">
                <div class="text-gray-400 text-xs mb-1">Type</div>
                <div class="text-white font-medium flex items-center">
                  <span class="mr-2">
                    {ticket.source === "free" ? "🎁" : "💳"}
                  </span>
                  {ticket.source === "free" ? "Free Ticket" : "Paid Ticket"}
                </div>
              </div>
            </div>
          </div>

          <!-- Wallet Assignment Section -->
          <div class="bg-gray-900/30 rounded-lg p-4 mb-6">
            <h4 class="text-white font-medium mb-3 flex items-center">
              <span class="mr-2">🎯</span>
              Wallet Assignment
            </h4>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Assigned Wallet
                </label>
                <div class="flex items-center space-x-2">
                  {#if ticket.wallet_address}
                    <code
                      class="bg-gray-800 px-3 py-2 rounded text-sm text-green-400 font-mono border border-green-500/20"
                    >
                      {ticket.wallet_address.slice(
                        0,
                        8
                      )}...{ticket.wallet_address.slice(-6)}
                    </code>
                    <span class="text-green-400 text-sm font-medium"
                      >✅ Assigned</span
                    >
                  {:else}
                    <div
                      class="bg-gray-800 px-3 py-2 rounded text-sm text-yellow-400 border border-yellow-500/20"
                    >
                      ⚠️ Not assigned
                    </div>
                    <span class="text-yellow-400 text-sm font-medium"
                      >Needs assignment</span
                    >
                  {/if}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  QR Code for Entry
                </label>
                {#if ticket.wallet_address}
                  <div
                    class="bg-white p-3 rounded-lg inline-block border-2 border-green-500/20"
                  >
                    <div
                      class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center"
                    >
                      <div class="text-center">
                        <div class="text-2xl mb-1">📱</div>
                        <div class="text-xs text-gray-600">QR Code</div>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-green-400 mt-1">
                    Ready for event entry
                  </p>
                {:else}
                  <div
                    class="bg-gray-800 p-3 rounded-lg inline-block border-2 border-yellow-500/20"
                  >
                    <div
                      class="w-20 h-20 bg-gray-700 rounded flex items-center justify-center"
                    >
                      <div class="text-center">
                        <div class="text-2xl mb-1">🔒</div>
                        <div class="text-xs text-gray-400">Locked</div>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-yellow-400 mt-1">
                    Assign wallet to unlock
                  </p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center justify-between pt-4 border-t border-gray-700"
          >
            <div class="text-sm text-gray-400">
              Order ID: {ticket.orderId}
            </div>
            <div class="flex space-x-3">
              <button
                on:click={() => openAssignmentModal(ticket)}
                class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                {ticket.wallet_address ? "🔄 Reassign" : "🎯 Assign Wallet"}
              </button>
              {#if ticket.wallet_address}
                <button
                  on:click={() => openQRModal(ticket)}
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  📱 View QR
                </button>
                <button
                  on:click={() => copyToClipboard(ticket.wallet_address)}
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  📋 Copy Address
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Assignment Modal -->
{#if showAssignmentModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    transition:fade
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4"
      transition:fly={{ y: 20 }}
    >
      <h3 class="text-xl font-semibold text-white mb-4">
        🎯 Assign Ticket to Wallet
      </h3>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Wallet Address
        </label>
        <input
          type="text"
          bind:value={walletAddress}
          placeholder="Enter wallet address (0x...)"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400"
        />
        <p class="text-xs text-gray-500 mt-1">
          This wallet will be used for event entry verification
        </p>
      </div>

      <div class="flex space-x-3">
        <button
          on:click={() => {
            showAssignmentModal = false;
            selectedTicket = null;
            walletAddress = "";
          }}
          class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={() =>
            assignTicketToWallet(selectedTicket.id, walletAddress)}
          disabled={!walletAddress || assigning}
          class="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {assigning ? "⏳ Assigning..." : "✅ Assign"}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- QR Code Modal -->
{#if showQRModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    transition:fade
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4"
      transition:fly={{ y: 20 }}
    >
      <h3 class="text-xl font-semibold text-white mb-4">
        📱 QR Code for Entry
      </h3>

      <div class="text-center mb-6">
        <div class="bg-white p-4 rounded-lg inline-block mb-4">
          <div
            class="w-48 h-48 bg-gray-100 rounded flex items-center justify-center"
          >
            <div class="text-center">
              <div class="text-4xl mb-2">📱</div>
              <div class="text-sm text-gray-600">QR Code Placeholder</div>
              <div class="text-xs text-gray-500 mt-1">
                {selectedTicket?.wallet_address?.slice(0, 12)}...
              </div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-400">
          Show this QR code at the event entrance for verification
        </p>
      </div>

      <div class="flex space-x-3">
        <button
          on:click={() => copyToClipboard(selectedTicket?.wallet_address || "")}
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📋 Copy Address
        </button>
        <button
          on:click={() => {
            showQRModal = false;
            selectedTicket = null;
          }}
          class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

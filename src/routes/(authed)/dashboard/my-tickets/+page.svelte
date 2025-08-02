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

  // Search and filter functionality
  let searchQuery = "";
  let activeFilter = "all";
  let showFilterDropdown = false;

  // Filter options
  const filterOptions = [
    { id: "all", label: "All Tickets" },
    { id: "assigned", label: "Assigned" },
    { id: "unassigned", label: "Unassigned" },
    { id: "concert", label: "Concert" },
    { id: "festival", label: "Festival" },
    { id: "summit", label: "Summit" },
  ];

  onMount(async () => {
    await loadTickets();
  });

  async function loadTickets() {
    try {
      loading = true;
      error = null;

      // Get wallet address from server-side data
      let userWalletAddress = null;

      // Safely access server data
      if (data && data.walletAddress) {
        userWalletAddress = data.walletAddress;
      }

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
            if (sessionData.type === "web3" && sessionData.wallet_address) {
              userWalletAddress = sessionData.wallet_address;
            }
          } catch (parseError) {
            // Silent error handling
          }
        }
      }

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

      // Transform the data to match the expected format
      tickets =
        ordersData?.map((order) => ({
          id: `ticket-${order.order_id}`,
          event_id: order.event_id,
          wallet_address: order.buyer_wallet_address,
          ticket_number: `TIX-${order.order_item_id?.slice(0, 8) || order.order_id.slice(0, 8)}`,
          status: order.payment_status || "confirmed",
          orderId: order.order_id,
          orderNumber: order.order_number,
          orderItemId: order.order_item_id,
          orderDate: order.created_at,
          totalAmount: order.total_amount,
          currency: order.currency || "SOL",
          orderStatus: order.order_status,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          buyerName: order.buyer_name,
          ticketType: order.ticket_type_name || "Standard",
          price: order.ticket_type_price || 0,
          source: order.payment_method === "free" ? "free" : "paid",
          events: {
            title: order.event_name,
            description: order.event_description || "Event details available",
            date: order.event_date,
            location: order.event_location,
          },
        })) || [];
    } catch (err) {
      error = "Failed to load tickets. Please try again.";
    } finally {
      loading = false;
    }
  }

  // Computed properties for filtering
  $: filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === "" ||
      ticket.events?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "assigned" && ticket.wallet_address) ||
      (activeFilter === "unassigned" && !ticket.wallet_address) ||
      (activeFilter === "concert" &&
        ticket.events?.title?.toLowerCase().includes("concert")) ||
      (activeFilter === "festival" &&
        ticket.events?.title?.toLowerCase().includes("festival")) ||
      (activeFilter === "summit" &&
        ticket.events?.title?.toLowerCase().includes("summit"));

    return matchesSearch && matchesFilter;
  });

  // For Web3 tickets, all tickets are considered "assigned" since they have a buyer wallet
  // The assignment feature is for transferring to different wallets
  $: unassignedTickets = []; // No unassigned tickets in Web3 system
  $: assignedTickets = filteredTickets; // All tickets are assigned to buyer

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

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      // Silent error handling
    }
  }

  function getEventType(eventTitle) {
    const title = eventTitle?.toLowerCase() || "";
    if (title.includes("concert")) return "concert";
    if (title.includes("festival")) return "festival";
    if (title.includes("summit")) return "summit";
    return "other";
  }

  function formatPrice(price, currency = "SOL") {
    if (price === 0) return "Free";
    return `${price} ${currency}`;
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Header -->
  <div class="mb-6 sm:mb-8">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
          My Tickets
        </h1>
        <p class="text-gray-400 text-sm sm:text-base">
          Manage your purchased tickets and assign them to wallet addresses
        </p>
      </div>
      <div class="flex items-center justify-between sm:justify-end space-x-3">
        <div class="text-right">
          <div class="text-xs sm:text-sm text-gray-400">Your Tickets</div>
          <div class="text-xl sm:text-2xl font-bold text-white">
            {tickets.length}
          </div>
        </div>
        <button
          on:click={loadTickets}
          class="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
        >
          <svg
            class="w-3 h-3 sm:w-4 sm:h-4"
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
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>

    <!-- Search and Action Bar -->
    <div class="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
      <!-- Search Bar -->
      <div class="flex-1 relative">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <svg
            class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search tickets..."
          class="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 sm:gap-3">
        <button
          class="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm sm:text-base"
        >
          <span class="hidden sm:inline">🔍 Q Search</span>
          <span class="sm:hidden">🔍</span>
        </button>
        <button
          on:click={() => (showFilterDropdown = !showFilterDropdown)}
          class="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span class="hidden sm:inline">Filter</span>
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div
      class="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 sm:pb-0"
    >
      {#each filterOptions as filter}
        <button
          on:click={() => (activeFilter = filter.id)}
          class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap {activeFilter ===
          filter.id
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
        >
          {filter.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"
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
        You haven't purchased any tickets with this wallet yet.
      </p>
      <a
        href="/marketplace"
        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <span class="mr-2">🎪</span>
        Browse Events
      </a>
    </div>
  {:else}
    <!-- Tickets Content -->
    <div class="space-y-8">
      <!-- All Tickets Section -->
      {#if filteredTickets.length > 0}
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
            My Tickets
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {#each filteredTickets as ticket (ticket.id)}
              <div
                class="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 hover:border-gray-600 transition-colors"
              >
                <!-- Ticket Header -->
                <div class="mb-3 sm:mb-4">
                  <h3 class="text-lg sm:text-xl font-bold text-white mb-2">
                    {ticket.events?.title || "Event Title"}
                  </h3>
                  <div class="flex items-center gap-2 mb-2 sm:mb-3">
                    <span
                      class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
                    >
                      Active
                    </span>
                    <span class="text-gray-400 text-xs sm:text-sm">•</span>
                    <span class="text-gray-400 text-xs sm:text-sm"
                      >{ticket.ticketType}</span
                    >
                  </div>
                </div>

                <!-- Ticket Details -->
                <div class="space-y-3 mb-6">
                  <div class="flex items-center text-sm">
                    <svg
                      class="w-4 h-4 text-gray-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span class="text-gray-300"
                      >Order Date: {formatDate(ticket.orderDate)}</span
                    >
                  </div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-400 mr-2">Ticket ID:</span>
                    <span class="text-gray-300">{ticket.ticket_number}</span>
                  </div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-400 mr-2">Buyer Wallet:</span>
                    <span class="text-green-400 font-mono"
                      >{ticket.wallet_address.slice(
                        0,
                        6
                      )}...{ticket.wallet_address.slice(-3)}</span
                    >
                  </div>
                  <div class="flex items-center text-sm">
                    <span class="text-gray-400 mr-2">Price:</span>
                    <span class="text-white font-medium"
                      >{formatPrice(ticket.price, ticket.currency)}</span
                    >
                  </div>
                </div>

                <!-- QR Code Section -->
                <div class="bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div class="bg-white rounded-lg p-3 sm:p-4 mb-2 sm:mb-3">
                    <div
                      class="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded flex items-center justify-center mx-auto"
                    >
                      <div class="text-center">
                        <div class="text-xl sm:text-2xl mb-1">📱</div>
                        <div class="text-xs text-gray-600">QR Code</div>
                        <div class="text-xs text-gray-500 mt-1">
                          {ticket.ticket_number}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p class="text-gray-400 text-xs sm:text-sm text-center">
                    Scan this QR code for event entry.
                  </p>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-2 sm:space-y-3">
                  <button
                    on:click={() => openQRModal(ticket)}
                    class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    <span>📱</span>
                    View QR Code
                  </button>
                  <div class="space-y-2 sm:space-y-3">
                    <label
                      class="block text-xs sm:text-sm font-medium text-gray-300"
                      >Transfer to Wallet Address</label
                    >
                    <input
                      type="text"
                      placeholder="e.g., 1A2b3C4d5E6f7G8h910jK112M3n405p6Q7r8S9t0"
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button
                      class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Transfer Ticket
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Assignment Modal -->
{#if showAssignmentModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fade
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 w-full max-w-md"
      transition:fly={{ y: 20 }}
    >
      <h3 class="text-xl font-semibold text-white mb-4">
        🎯 Assign Ticket to Wallet
      </h3>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2"
          >Wallet Address</label
        >
        <input
          type="text"
          bind:value={walletAddress}
          placeholder="Enter wallet address (0x...)"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
          class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fade
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 w-full max-w-md"
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
                {selectedTicket?.ticket_number ||
                  `TIX-${selectedTicket?.orderItemId?.slice(0, 8)}`}
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
          on:click={() =>
            copyToClipboard(
              selectedTicket?.ticket_number ||
                `TIX-${selectedTicket?.orderItemId?.slice(0, 8)}` ||
                ""
            )}
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📋 Copy Ticket ID
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

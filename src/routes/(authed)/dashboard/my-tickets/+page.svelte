<script>
  import { onMount } from "svelte";
  import { supabase, transferTicket } from "$lib/supabase";
  import { fade, fly } from "svelte/transition";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";
  import { showToast } from "$lib/store";

  export let data;

  let tickets = [];
  let loading = true;
  let error = null;
  let selectedTicket = null;
  let showActionModal = false;
  let showQRModal = false;
  let showTransferModal = false;
  let walletAddress = "";
  let assigning = false;
  let copyFeedback = false;

  // Confirmation dialog state
  let showConfirmDialog = false;
  let confirmDialogData = {
    title: "",
    message: "",
    confirmText: "",
    confirmVariant: "success",
  };

  // Toast state (removed - using global toast system)

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

      // Use the bypass function to fetch tickets by current owner (bypasses RLS)
      const { data: ordersData, error: fetchError } = await supabase.rpc(
        "load_tickets_by_current_owner",
        { p_wallet_address: userWalletAddress }
      );

      if (!fetchError && ordersData) {
        // Process the data from the main database function
        const ticketArray = ordersData.map((order) => ({
          id: `ticket-${order.order_id}-${order.order_item_id}`,
          event_id: order.event_id,
          wallet_address: order.current_owner,
          original_buyer_wallet: order.original_buyer_wallet,
          ticket_number: `TIX-${order.order_item_id?.slice(0, 8)}`,
          status: order.payment_status || "confirmed",
          orderId: order.order_id,
          orderNumber: order.order_number,
          orderItemId: order.order_item_id,
          order_item_id: order.order_item_id, // Add this for consistency
          orderDate: order.created_at,
          totalAmount: order.total_amount,
          currency: order.currency || "SOL",
          orderStatus: order.order_status,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          buyerName: order.original_buyer_name,
          ticketType: order.ticket_type_name || "Standard",
          price: order.ticket_type_price || 0,
          source: order.payment_method === "free" ? "free" : "paid",
          isTransferred: order.current_owner !== order.original_buyer_wallet,
          events: {
            title: order.event_name,
            description: order.event_description || "Event details available",
            date: order.event_date,
            location: order.event_location,
          },
        }));
        tickets = ticketArray;
        return;
      }

      if (fetchError) {
        console.error("Database function error:", fetchError);

        // If the function doesn't exist, try a fallback approach
        if (
          fetchError.message.includes("function") &&
          fetchError.message.includes("does not exist")
        ) {
          console.log("Database function not found, trying fallback...");

          // Try to load orders directly from the orders table
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("orders")
            .select(
              `
              *,
              events(name, description, date, location),
              order_items(
                *,
                ticket_types(name, price)
              )
            `
            )
            .eq("buyer_wallet_address", userWalletAddress)
            .order("created_at", { ascending: false });

          if (fallbackError) {
            throw new Error(`Fallback query failed: ${fallbackError.message}`);
          }

          // Transform fallback data to match expected format
          // Handle multiple order items per order
          const ticketArray = [];
          fallbackData?.forEach((order) => {
            if (order.order_items && order.order_items.length > 0) {
              // Create a ticket for each order item
              order.order_items.forEach((orderItem, index) => {
                ticketArray.push({
                  id: `ticket-${order.id}-${orderItem.id || `item-${index}`}`,
                  event_id: order.event_id,
                  wallet_address: order.buyer_wallet_address,
                  original_buyer_wallet: order.buyer_wallet_address,
                  ticket_number: `TIX-${orderItem.id?.slice(0, 8) || order.id?.slice(0, 8)}`,
                  status: order.payment_status || "confirmed",
                  orderId: order.id,
                  orderNumber: order.order_number,
                  orderItemId: orderItem.id,
                  orderDate: order.created_at,
                  totalAmount: order.total_amount,
                  currency: order.currency || "SOL",
                  orderStatus: order.order_status,
                  paymentMethod: order.payment_method,
                  paymentStatus: order.payment_status,
                  buyerName: order.buyer_name,
                  ticketType: orderItem.ticket_types?.name || "Standard",
                  price: orderItem.ticket_types?.price || 0,
                  source: order.payment_method === "free" ? "free" : "paid",
                  isTransferred: false,
                  events: {
                    title: order.events?.name,
                    description:
                      order.events?.description || "Event details available",
                    date: order.events?.date,
                    location: order.events?.location,
                  },
                });
              });
            } else {
              // Fallback for orders without order items
              ticketArray.push({
                id: `ticket-${order.id}`,
                event_id: order.event_id,
                wallet_address: order.buyer_wallet_address,
                original_buyer_wallet: order.buyer_wallet_address,
                ticket_number: `TIX-${order.id?.slice(0, 8)}`,
                status: order.payment_status || "confirmed",
                orderId: order.id,
                orderNumber: order.order_number,
                orderItemId: null,
                orderDate: order.created_at,
                totalAmount: order.total_amount,
                currency: order.currency || "SOL",
                orderStatus: order.order_status,
                paymentMethod: order.payment_method,
                paymentStatus: order.payment_status,
                buyerName: order.buyer_name,
                ticketType: "Standard",
                price: 0,
                source: order.payment_method === "free" ? "free" : "paid",
                isTransferred: false,
                events: {
                  title: order.events?.name,
                  description:
                    order.events?.description || "Event details available",
                  date: order.events?.date,
                  location: order.events?.location,
                },
              });
            }
          });
          tickets = ticketArray;

          return; // Exit early since we handled the fallback
        }

        throw new Error(`Database function error: ${fetchError.message}`);
      }

      // Transform the data to match the expected format
      tickets =
        ordersData?.map((order, index) => ({
          id: `ticket-${order.order_id}-${order.order_item_id || `item-${index}`}`,
          event_id: order.event_id,
          wallet_address: order.current_owner, // Use current owner
          original_buyer_wallet: order.original_buyer_wallet,
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
          buyerName: order.original_buyer_name,
          ticketType: order.ticket_type_name || "Standard",
          price: order.ticket_type_price || 0,
          source: order.payment_method === "free" ? "free" : "paid",
          isTransferred: order.transfer_history === "Transferred to you",
          events: {
            title: order.event_name,
            description: order.event_description || "Event details available",
            date: order.event_date,
            location: order.event_location,
          },
        })) || [];

      // Debug: Check for duplicate IDs
      const ticketIds = tickets.map((t) => t.id);
      const uniqueIds = new Set(ticketIds);
      if (ticketIds.length !== uniqueIds.size) {
        console.warn(
          "Duplicate ticket IDs found:",
          ticketIds.filter((id, index) => ticketIds.indexOf(id) !== index)
        );
      }
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

      // Get the order item ID from the selected ticket
      const orderItemId =
        selectedTicket?.orderItemId || selectedTicket?.order_item_id;
      const currentOwner = selectedTicket?.wallet_address;

      if (!orderItemId) {
        throw new Error("Ticket ID not found");
      }

      if (!currentOwner) {
        throw new Error("Current owner not found");
      }

      if (!walletAddress || walletAddress.trim() === "") {
        throw new Error("Please enter a valid wallet address");
      }

      // Basic wallet address validation
      const trimmedWallet = walletAddress.trim();
      if (trimmedWallet.length < 10) {
        throw new Error("Wallet address seems too short");
      }

      // Check if it's the same wallet
      if (trimmedWallet.toLowerCase() === currentOwner.toLowerCase()) {
        throw new Error("Cannot transfer to the same wallet address");
      }

      console.log("Transferring ticket:", {
        orderItemId,
        fromWallet: currentOwner,
        toWallet: walletAddress,
      });

      // Use the transfer function
      const result = await transferTicket(
        orderItemId,
        currentOwner,
        walletAddress,
        "Transfer via My Tickets page"
      );

      console.log("Transfer result:", result);

      if (!result.success) {
        throw new Error(result.error || "Transfer failed");
      }

      // Show success toast
      showToast(
        "success",
        "Transfer Successful",
        `Ticket successfully transferred to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-3)}`
      );

      // Refresh the tickets list
      await loadTickets();
      showTransferModal = false;
      selectedTicket = null;
      walletAddress = "";
    } catch (err) {
      console.error("Transfer error:", err);
      // Show error toast
      showToast("error", "Transfer Failed", err.message || "Transfer failed");
    } finally {
      assigning = false;
    }
  }

  function showTransferConfirmation(ticket) {
    selectedTicket = ticket;
    walletAddress = "";

    confirmDialogData = {
      title: "Transfer Ticket",
      message: `Are you sure you want to transfer this ticket? You will no longer own it after the transfer.`,
      confirmText: "Transfer",
      confirmVariant: "warning",
    };
    showConfirmDialog = true;
  }

  function handleTransferConfirm() {
    showConfirmDialog = false;
    showTransferModal = true;
  }

  function handleTransferCancel() {
    showConfirmDialog = false;
    selectedTicket = null;
  }

  function openActionModal(ticket) {
    selectedTicket = ticket;
    showActionModal = true;
  }

  function openQRModal(ticket) {
    selectedTicket = ticket;
    showQRModal = true;
  }

  function openTransferModal(ticket) {
    selectedTicket = ticket;
    walletAddress = ticket.wallet_address || "";
    showTransferModal = true;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback = true;
      setTimeout(() => {
        copyFeedback = false;
      }, 2000);
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
  <div class="text-left mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
      My Tickets
    </h1>
    <p class="text-gray-400 text-base sm:text-lg">
      Manage your purchased tickets and assign them to wallet addresses
    </p>
  </div>

  <!-- Search and Filter Section -->
  <div class="mb-6 sm:mb-8">
    <!-- Search Bar -->
    <div class="relative mb-4">
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
        class="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
      />
    </div>

    <!-- Filter Buttons -->
    <div class="flex flex-wrap gap-2">
      {#each filterOptions as filter}
        <button
          on:click={() => (activeFilter = filter.id)}
          class="px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base {activeFilter ===
          filter.id
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}"
        >
          {filter.label}
        </button>
      {/each}
      <button
        on:click={loadTickets}
        class="px-3 sm:px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
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
        <span class="hidden sm:inline">Refresh</span>
      </button>
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
        <svg
          class="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">No tickets found</h3>
      <p class="text-gray-400 mb-6">
        You haven't purchased any tickets with this wallet yet.
      </p>

      <!-- Debug Information -->
      <div
        class="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 text-left"
      >
        <h4 class="text-sm font-semibold text-gray-300 mb-2">
          Debug Information:
        </h4>
        <div class="text-xs text-gray-400 space-y-1">
          <p>Wallet Address: {data?.walletAddress || "Not found"}</p>
          <p>Session Type: {data?.sessionType || "Unknown"}</p>
          <p>User Name: {data?.userName || "Unknown"}</p>
          <p>Tickets Array Length: {tickets.length}</p>
          <p>Loading State: {loading}</p>
          <p>Error State: {error || "None"}</p>
        </div>
        <div class="flex gap-2 mt-3">
          <button
            on:click={() =>
              window.open(
                `/api/test-tickets?wallet=${data?.walletAddress || ""}`,
                "_blank"
              )}
            class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Test Database Functions
          </button>
          <button
            on:click={() => window.open("/api/check-db", "_blank")}
            class="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
          >
            Check Database State
          </button>
        </div>
      </div>

      <a
        href="/marketplace"
        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        Browse Events
      </a>
    </div>
  {:else}
    <!-- Tickets Content -->
    <div class="space-y-8">
      <!-- All Tickets Section -->
      {#if filteredTickets.length > 0}
        <div>
          <!-- Ticket Statistics Section -->
          <div
            class="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 border border-gray-700"
          >
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <!-- Total Tickets -->
              <div class="text-center">
                <div class="text-2xl sm:text-3xl font-bold text-purple-500">
                  {filteredTickets.length}
                </div>
                <div class="text-gray-400 text-xs sm:text-sm mt-1">
                  Total Tickets
                </div>
              </div>

              <!-- Paid Tickets -->
              <div class="text-center">
                <div class="text-2xl sm:text-3xl font-bold text-green-500">
                  {filteredTickets.filter((t) => t.paymentStatus === "paid")
                    .length}
                </div>
                <div class="text-gray-400 text-xs sm:text-sm mt-1">
                  Paid Tickets
                </div>
              </div>

              <!-- Free Tickets -->
              <div class="text-center">
                <div class="text-2xl sm:text-3xl font-bold text-yellow-500">
                  {filteredTickets.filter((t) => t.source === "free").length}
                </div>
                <div class="text-gray-400 text-xs sm:text-sm mt-1">
                  Free Tickets
                </div>
              </div>

              <!-- Unique Events -->
              <div class="text-center">
                <div class="text-2xl sm:text-3xl font-bold text-blue-500">
                  {new Set(filteredTickets.map((t) => t.event_id)).size}
                </div>
                <div class="text-gray-400 text-xs sm:text-sm mt-1">
                  Unique Events
                </div>
              </div>
            </div>
          </div>

          <!-- Ticket Types Section -->
          <div class="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 class="text-lg font-bold text-white mb-4">Ticket Types</h3>
            <div class="flex flex-wrap gap-2">
              {#each Object.entries(filteredTickets.reduce((acc, ticket) => {
                  const type = ticket.ticketType || "Standard";
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {})) as [type, count]}
                <span
                  class="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                >
                  {type}: {count}
                </span>
              {/each}
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {#each filteredTickets as ticket (ticket.id)}
              <div
                class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 hover:border-gray-600 transition-colors"
              >
                <!-- Ticket Header -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 sm:mb-6"
                >
                  <h3 class="text-lg sm:text-xl font-bold text-white">
                    {ticket.events?.title || "Event Title"}
                  </h3>
                  <span
                    class="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full uppercase tracking-wide self-start sm:self-auto"
                  >
                    {ticket.paymentStatus === "paid"
                      ? "Completed"
                      : ticket.paymentStatus}
                  </span>
                </div>

                <!-- Ticket Details Grid -->
                <div class="grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <!-- Event Date -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0"
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
                      <span class="text-gray-400 font-medium text-xs sm:text-sm"
                        >Event Date</span
                      >
                    </div>
                    <span
                      class="text-white font-semibold text-xs sm:text-sm text-right"
                      >{formatDate(ticket.events?.date)}</span
                    >
                  </div>

                  <!-- Location -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium text-xs sm:text-sm"
                        >Location</span
                      >
                    </div>
                    <span
                      class="text-white font-semibold text-xs sm:text-sm text-right"
                      >{ticket.events?.location || "TBD"}</span
                    >
                  </div>

                  <!-- Order Date -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium text-xs sm:text-sm"
                        >Order Date</span
                      >
                    </div>
                    <span
                      class="text-white font-semibold text-xs sm:text-sm text-right"
                      >{formatDate(ticket.orderDate)}</span
                    >
                  </div>

                  <!-- Order Number -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium text-xs sm:text-sm"
                        >Order Number</span
                      >
                    </div>
                    <span
                      class="text-white font-mono font-semibold text-xs sm:text-sm text-right"
                      >#{ticket.orderNumber}</span
                    >
                  </div>

                  <!-- Ticket # -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium text-xs sm:text-sm"
                        >Ticket #</span
                      >
                    </div>
                    <span
                      class="text-white font-mono font-semibold text-xs sm:text-sm text-right"
                      >{ticket.orderItemId ||
                        ticket.order_item_id ||
                        "N/A"}</span
                    >
                  </div>

                  <!-- Owner -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium">Owner</span>
                    </div>
                    <div class="flex items-center">
                      <span class="text-green-400 font-mono font-semibold">
                        {ticket.wallet_address.slice(
                          0,
                          6
                        )}...{ticket.wallet_address.slice(-3)}
                      </span>
                      {#if ticket.isTransferred}
                        <span
                          class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full"
                        >
                          Transferred
                        </span>
                      {/if}
                    </div>
                  </div>

                  <!-- Price -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-5 h-5 text-gray-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium">Price</span>
                    </div>
                    <span class="text-white font-semibold"
                      >{formatPrice(ticket.price, ticket.currency)}</span
                    >
                  </div>

                  <!-- Payment Status -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-5 h-5 text-gray-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium"
                        >Payment Status</span
                      >
                    </div>
                    <span class="text-green-400 font-semibold capitalize"
                      >{ticket.paymentStatus}</span
                    >
                  </div>

                  <!-- Payment Method -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <svg
                        class="w-5 h-5 text-gray-400 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span class="text-gray-400 font-medium"
                        >Payment Method</span
                      >
                    </div>
                    <span class="text-white font-semibold">
                      {#if ticket.paymentMethod === "free"}
                        <span class="text-green-400">Free Ticket</span>
                      {:else if ticket.paymentMethod === "solana"}
                        <span class="text-blue-400">💎 Solana</span>
                      {:else}
                        <span class="text-gray-300">{ticket.paymentMethod}</span
                        >
                      {/if}
                    </span>
                  </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-700 mb-6"></div>

                <!-- Total Amount -->
                <div class="flex items-center justify-between mb-6">
                  <span class="text-white font-bold text-lg">Total Amount</span>
                  <span class="text-blue-400 font-bold text-lg">
                    {formatPrice(
                      ticket.totalAmount || ticket.price,
                      ticket.currency
                    )}
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-2 sm:space-y-3">
                  <button
                    on:click={() => openQRModal(ticket)}
                    class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
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
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                      />
                    </svg>
                    View QR Code
                  </button>
                  <button
                    on:click={() => showTransferConfirmation(ticket)}
                    class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 font-medium text-sm sm:text-base flex items-center justify-center gap-2"
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
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    Transfer Ticket
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Important Information Section -->
          <div
            class="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6"
          >
            <h4 class="text-blue-300 font-semibold mb-3">
              Important Information
            </h4>
            <ul class="text-gray-300 space-y-2 text-sm">
              <li>• Your tickets are confirmed and ready for the events</li>
              <li>
                • Please arrive at least 15 minutes before each event starts
              </li>
              <li>• Bring a valid ID for ticket verification</li>
              <li>• Tickets can be transferred to other wallet addresses</li>
              <li>• Free tickets are non-refundable but transferable</li>
              <li>• Contact support if you have any questions</li>
            </ul>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- QR Code Modal -->
{#if showQRModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fade
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      transition:fly={{ y: 20 }}
    >
      <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
          />
        </svg>
        QR Code for Entry
      </h3>

      <!-- Ticket Info -->
      <div class="bg-gray-900 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-medium text-white mb-2">
          {selectedTicket?.events?.title || "Event Title"}
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Ticket #:</span>
            <span class="text-white font-mono"
              >{selectedTicket?.orderItemId ||
                selectedTicket?.order_item_id ||
                selectedTicket?.ticket_number}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Type:</span>
            <span class="text-white">{selectedTicket?.ticketType}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Price:</span>
            <span class="text-white"
              >{formatPrice(
                selectedTicket?.price,
                selectedTicket?.currency
              )}</span
            >
          </div>
        </div>
      </div>

      <!-- QR Code Display -->
      <div class="text-center mb-6">
        <div class="bg-white p-6 rounded-lg inline-block mb-4">
          <div class="w-48 h-48 flex items-center justify-center">
            {#if selectedTicket?.wallet_address}
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodeURIComponent(
                  selectedTicket?.wallet_address
                )}"
                alt="QR Code for {selectedTicket?.wallet_address}"
                class="w-full h-full object-contain"
              />
            {:else}
              <div class="text-center">
                <svg
                  class="w-16 h-16 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                  />
                </svg>
                <div class="text-sm text-gray-600">QR Code</div>
                <div class="text-xs text-gray-500 mt-1">No ticket number</div>
              </div>
            {/if}
          </div>
        </div>
        <p class="text-sm text-gray-400 mb-4">
          Show this QR code at the event entrance for verification
        </p>
        <button
          on:click={() => copyToClipboard(selectedTicket?.wallet_address || "")}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto relative"
        >
          {#if copyFeedback}
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Copied!
          {:else}
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy Wallet Address
          {/if}
        </button>
      </div>

      <!-- Close Button -->
      <div class="flex justify-end">
        <button
          on:click={() => {
            showQRModal = false;
            selectedTicket = null;
          }}
          class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Transfer Modal -->
{#if showTransferModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fade
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      transition:fly={{ y: 20 }}
    >
      <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        Transfer Ticket
      </h3>

      <!-- Ticket Info -->
      <div class="bg-gray-900 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-medium text-white mb-2">
          {selectedTicket?.events?.title || "Event Title"}
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Ticket #:</span>
            <span class="text-white font-mono"
              >{selectedTicket?.orderItemId ||
                selectedTicket?.order_item_id ||
                selectedTicket?.ticket_number}</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Current Owner:</span>
            <span class="text-green-400 font-mono text-xs">
              {selectedTicket?.wallet_address?.slice(
                0,
                6
              )}...{selectedTicket?.wallet_address?.slice(-3)}
            </span>
          </div>
          {#if selectedTicket?.isTransferred}
            <div class="flex justify-between">
              <span class="text-gray-400">Original Buyer:</span>
              <span class="text-blue-400 font-mono text-xs">
                {selectedTicket?.original_buyer_wallet?.slice(
                  0,
                  6
                )}...{selectedTicket?.original_buyer_wallet?.slice(-3)}
              </span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Transfer Form -->
      <div class="space-y-4 mb-6">
        <div>
          <label
            for="wallet-address"
            class="block text-sm font-medium text-gray-300 mb-2"
            >Transfer to Wallet Address</label
          >
          <input
            id="wallet-address"
            type="text"
            bind:value={walletAddress}
            placeholder="Enter wallet address (0x...)"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
          />
          <p class="text-xs text-gray-500 mt-1">
            This wallet will be used for event entry verification
          </p>
        </div>

        <button
          on:click={() => assignTicketToWallet(null, walletAddress)}
          disabled={!walletAddress || assigning}
          class="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {#if assigning}
            <svg
              class="w-4 h-4 animate-spin"
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
            Transferring...
          {:else}
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
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Transfer Ticket
          {/if}
        </button>
      </div>

      <!-- Close Button -->
      <div class="flex justify-end">
        <button
          on:click={() => {
            showTransferModal = false;
            selectedTicket = null;
            walletAddress = "";
          }}
          class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Confirmation Dialog -->
<ConfirmationDialog
  bind:show={showConfirmDialog}
  title={confirmDialogData.title}
  message={confirmDialogData.message}
  confirmText={confirmDialogData.confirmText}
  confirmVariant={confirmDialogData.confirmVariant}
  loading={assigning}
  on:confirm={handleTransferConfirm}
  on:cancel={handleTransferCancel}
/>

<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    loadUserOrders,
    verifyWeb3Session,
    supabase,
    listAllOrders,
  } from "$lib/supabase.js";
  import { sessionFromDb } from "$lib/store";
  import BackButton from "$lib/components/BackButton.svelte";
  import GradientButton from "$lib/components/GradientButton.svelte";

  // Get order ID from URL params
  $: orderId = $page.params.orderId;
  let order: any = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // Debug: List all orders in database
      const { orders: allOrders } = await listAllOrders();
      // First check if this is a temporary order stored in localStorage
      const tempOrders = JSON.parse(
        localStorage.getItem("tempFreeTicketOrders") || "[]"
      );
      const tempOrder = tempOrders.find((o: any) => o.id === orderId);
      if (tempOrder) {
        // This is a temporary order from localStorage
        order = {
          ...tempOrder,
          events: {
            name: "Event", // We'll need to get this from the event data
            date: new Date().toISOString(),
            location: "Event Location",
          },
          order_items: tempOrder.tickets.map((ticket: any) => ({
            ticket_types: {
              name: ticket.ticket_type_name,
            },
            ticket_number: ticket.ticket_number,
          })),
        };
      } else {
        // Try to load from database - check both Web3 and traditional sessions
        let userId = null;
        let walletAddress = null;

        // Try Web3 session first
        const web3Session = await verifyWeb3Session();
        if (web3Session.success && web3Session.user) {
          userId = web3Session.user.id;
          walletAddress = web3Session.user.wallet_address;
          } else {
          // Fallback to traditional session
          userId = $sessionFromDb;
          }

        // Try to get the specific order by ID using the database function
        const { data: orderData, error: orderError } = await supabase.rpc(
          "get_order_by_id",
          { p_order_id: orderId }
        );

        if (!orderError && orderData && orderData.length > 0) {
          const orderResult = orderData[0];
          order = {
            id: orderResult.order_id,
            event_id: orderResult.event_id,
            buyer_wallet_address: orderResult.buyer_wallet_address,
            buyer_name: orderResult.buyer_name,
            order_number: orderResult.order_number,
            total_amount: orderResult.total_amount,
            currency: orderResult.currency,
            payment_method: orderResult.payment_method,
            payment_status: orderResult.payment_status,
            order_status: orderResult.order_status,
            created_at: orderResult.created_at,
            events: {
              name: orderResult.event_name || "Unknown Event",
              date: orderResult.event_date,
              location: orderResult.event_location || "Unknown",
            },
            order_items: [
              {
                ticket_types: {
                  name: orderResult.ticket_type_name || "Free Ticket",
                  price: orderResult.ticket_type_price || 0,
                },
              },
            ],
          };
        } else {
          // If order not found in database, check if it's a temporary order
          const tempOrders = JSON.parse(
            localStorage.getItem("tempFreeTicketOrders") || "[]"
          );
          const tempOrder = tempOrders.find((o: any) => o.id === orderId);

          if (tempOrder) {
            order = {
              ...tempOrder,
              events: {
                name: "Event",
                date: new Date().toISOString(),
                location: "Event Location",
              },
              order_items: tempOrder.tickets.map((ticket: any) => ({
                ticket_types: { name: ticket.ticket_type_name },
                ticket_number: ticket.ticket_number,
              })),
            };
          } else {
            error = "Order not found";
          }
        }
      }

      loading = false;
    } catch (err: any) {
      error = "Failed to load order";
      loading = false;
    }
  });

  function downloadTickets() {
    // TODO: Implement ticket download functionality
    alert("Ticket download functionality will be implemented soon!");
  }

  function shareEvent() {
    if (navigator.share) {
      navigator.share({
        title: order?.events?.name || "Event",
        text: `I just got free tickets to ${order?.events?.name}!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Event link copied to clipboard!");
    }
  }
</script>

<div class="min-h-screen bg-gray-900 text-white">
  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"
        ></div>
        <p class="text-gray-400">Loading ticket confirmation...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-white mb-2">Order Not Found</h1>
        <p class="text-gray-400 mb-6">{error}</p>
        <button
          on:click={() => goto("/marketplace")}
          class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          Back to Marketplace
        </button>
      </div>
    </div>
  {:else if order}
    <!-- Back Button -->
    <BackButton
      top="top-20"
      left="left-6"
      link="/marketplace"
      title="Back to Marketplace"
    />

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <!-- Success Header -->
      <div class="text-center mb-12">
        <div class="text-green-500 text-8xl mb-6">🎉</div>
        <h1 class="text-4xl font-bold text-white mb-4">
          {order.payment_method === "free"
            ? "Free Tickets Claimed Successfully!"
            : "Tickets Claimed Successfully!"}
        </h1>
        <p class="text-xl text-gray-300 mb-2">
          You've successfully claimed your {order.payment_method === "free"
            ? "free "
            : ""}tickets for
        </p>
        <h2
          class="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
        >
          {order.events?.name}
        </h2>

        {#if order.payment_method === "free"}
          <div
            class="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg max-w-md mx-auto"
          >
            <div class="flex items-center gap-2 text-green-400">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="font-semibold">Free Ticket Order</span>
            </div>
            <p class="text-sm text-green-300 mt-1">
              No payment required - your tickets are ready to use!
            </p>
          </div>
        {/if}
      </div>

      <!-- Order Details Card -->
      <div class="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
        <h3 class="text-2xl font-bold text-white mb-6">Order Details</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-gray-400 text-sm">Order Number</p>
            <p class="text-white font-mono text-lg">{order.order_number}</p>
          </div>

          <div>
            <p class="text-gray-400 text-sm">Order Date</p>
            <p class="text-white text-lg">
              {new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div>
            <p class="text-gray-400 text-sm">Event Date</p>
            <p class="text-white text-lg">
              {new Date(order.events?.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div>
            <p class="text-gray-400 text-sm">Event Location</p>
            <p class="text-white text-lg">{order.events?.location}</p>
          </div>

          <div>
            <p class="text-gray-400 text-sm">Total Tickets</p>
            <p class="text-white text-lg font-bold">
              {order.order_items?.length || 0} tickets
            </p>
          </div>

          <div>
            <p class="text-gray-400 text-sm">Payment Status</p>
            <p class="text-green-400 text-lg font-semibold capitalize">
              {order.payment_status}
            </p>
          </div>

          {#if order.payment_method === "free"}
            <div>
              <p class="text-gray-400 text-sm">Ticket Type</p>
              <p class="text-blue-400 text-lg font-semibold">🎫 Free Ticket</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Ticket Details -->
      {#if order.order_items && order.order_items.length > 0}
        <div class="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
          <h3 class="text-2xl font-bold text-white mb-6">Your Tickets</h3>

          <div class="space-y-4">
            {#each order.order_items as item}
              <div
                class="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div class="flex-1">
                  <h4 class="text-white font-semibold">
                    {item.ticket_types?.name || "General Admission"}
                  </h4>
                  <p class="text-gray-400 text-sm">
                    Ticket #{item.ticket_number}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-green-400 font-bold">Free</p>
                  <p class="text-gray-400 text-sm">Confirmed</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <GradientButton
          text="Download Tickets"
          onClick={downloadTickets}
          icon="download"
          class_="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        />

        <GradientButton
          text="Share Event"
          onClick={shareEvent}
          icon="share"
          class_="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        />

        <button
          on:click={() => goto("/marketplace")}
          class="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 text-center"
        >
          Browse More Events
        </button>
      </div>

      <!-- Important Information -->
      <div
        class="mt-12 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg"
      >
        <h4 class="text-blue-300 font-semibold mb-3">Important Information</h4>
        <ul class="text-gray-300 space-y-2 text-sm">
          <li>• Your tickets are confirmed and ready for the event</li>
          <li>• Please arrive at least 15 minutes before the event starts</li>
          <li>• Bring a valid ID for ticket verification</li>
          <li>• Tickets are non-transferable and non-refundable</li>
          <li>• Contact support if you have any questions</li>
        </ul>
      </div>

      <!-- Temporary Solution Notice -->
      {#if order.id?.startsWith("temp-")}
        <div
          class="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
        >
          <h4 class="text-yellow-300 font-semibold mb-2">
            ⚠️ Temporary Solution
          </h4>
          <p class="text-yellow-200 text-sm">
            This order is temporarily stored locally while we resolve database
            permission issues. Your tickets are still valid for the event, but
            please contact support if you need a permanent record of your order.
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

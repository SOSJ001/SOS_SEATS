<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { supabase, loadUserEvents } from "$lib/supabase";
  import { sessionFromDb, showToast } from "$lib/store";

  let order: any = null;
  let loading = true;
  let error: string | null = null;

  $: orderId = $page.params.id;

  async function loadOrder() {
    if (!orderId) {
      error = "Order ID is required";
      loading = false;
      return;
    }

    try {
      const userId = $sessionFromDb;
      if (!userId) {
        error = "User not found";
        loading = false;
        return;
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      if (eventIds.length === 0) {
        error = "Order not found";
        loading = false;
        return;
      }

      // Fetch order
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          "*, events(name, date, location), order_items(*, ticket_types(name, price))"
        )
        .eq("id", orderId)
        .in("event_id", eventIds)
        .single();

      if (fetchError || !data) {
        error = "Order not found";
        loading = false;
        return;
      }

      order = data;
    } catch (err: any) {
      error = err.message || "Failed to load order";
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function formatCurrency(amount: number, currency: string = "NLe") {
    return `${amount.toFixed(2)} ${currency}`;
  }

  function getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-yellow-400 text-black";
      case "failed":
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  }

  onMount(() => {
    loadOrder();
  });
</script>

<div class="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <button
        on:click={() => goto("/dashboard/wallet")}
        class="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2 text-sm sm:text-base"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Wallet
      </button>
      <h1 class="text-2xl sm:text-3xl font-bold">Order Details</h1>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <svg
          class="animate-spin h-8 w-8 text-cyan-400"
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
    {:else if error}
      <div class="bg-red-500/10 border border-red-500 rounded-lg p-4">
        <p class="text-red-400">{error}</p>
      </div>
    {:else if order}
      <!-- Order Card -->
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <!-- Header Row -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-2">
              Order #{order.order_number || order.id.slice(0, 8)}
            </h2>
            <p class="text-gray-400 text-sm sm:text-base">
              {formatDate(order.created_at)}
            </p>
          </div>
          <div class="flex flex-col sm:items-end gap-2">
            <span class="text-2xl sm:text-3xl font-bold text-green-400">
              {formatCurrency(
                Number(order.total_amount || 0),
                order.payment_method === "orange_money" ||
                  order.payment_method === "afrimoney"
                  ? "NLe"
                  : order.currency || "SOL"
              )}
            </span>
            <span
              class="px-3 py-1 text-xs sm:text-sm font-medium rounded-full {getStatusClass(
                order.payment_status
              )} inline-block"
            >
              {order.payment_status?.toUpperCase() || "UNKNOWN"}
            </span>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div>
            <p class="text-gray-400 text-sm mb-1">Order ID</p>
            <p class="text-white font-mono text-sm break-all">{order.id}</p>
          </div>

          <div>
            <p class="text-gray-400 text-sm mb-1">Payment Method</p>
            <p class="text-white capitalize">
              {order.payment_method === "orange_money"
                ? "Orange Money"
                : order.payment_method === "afrimoney"
                  ? "Afrimoney"
                  : order.payment_method || "N/A"}
            </p>
          </div>

          <div>
            <p class="text-gray-400 text-sm mb-1">Currency</p>
            <p class="text-white">
              {order.payment_method === "orange_money" ||
              order.payment_method === "afrimoney"
                ? "NLe"
                : order.currency || "SOL"}
            </p>
          </div>

          <div>
            <p class="text-gray-400 text-sm mb-1">Order Status</p>
            <p class="text-white capitalize">
              {order.order_status || "N/A"}
            </p>
          </div>
        </div>

        <!-- Event Information -->
        {#if order.events}
          <div class="mb-6 pt-6 border-t border-gray-700">
            <h3 class="text-lg font-semibold mb-4">Event Information</h3>
            <div class="space-y-2">
              <div>
                <p class="text-gray-400 text-sm mb-1">Event Name</p>
                <p class="text-white">{order.events.name || "N/A"}</p>
              </div>
              {#if order.events.date}
                <div>
                  <p class="text-gray-400 text-sm mb-1">Event Date</p>
                  <p class="text-white">{formatDate(order.events.date)}</p>
                </div>
              {/if}
              {#if order.events.location}
                <div>
                  <p class="text-gray-400 text-sm mb-1">Location</p>
                  <p class="text-white">{order.events.location}</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Order Items -->
        {#if order.order_items && order.order_items.length > 0}
          <div class="pt-6 border-t border-gray-700">
            <h3 class="text-lg font-semibold mb-4">Order Items</h3>
            <div class="space-y-3">
              {#each order.order_items as item}
                <div
                  class="bg-gray-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <p class="text-white font-medium">
                      {item.ticket_types?.name || "Ticket"}
                    </p>
                    {#if item.quantity}
                      <p class="text-gray-400 text-sm">
                        Quantity: {item.quantity}
                      </p>
                    {/if}
                  </div>
                  {#if item.ticket_types?.price}
                    <p class="text-white font-semibold">
                      {formatCurrency(
                        Number(item.ticket_types.price),
                        order.payment_method === "orange_money" ||
                          order.payment_method === "afrimoney"
                          ? "NLe"
                          : order.currency || "SOL"
                      )}
                    </p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>


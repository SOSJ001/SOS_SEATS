<script lang="ts">
  import { fade, fly, slide } from "svelte/transition";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ShareEventModal from "$lib/components/ShareEventModal.svelte";
  import { page } from "$app/stores";
  import { deleteEvent, supabase } from "$lib/supabase.js";

  // Get the event data from the server
  export let data;

  let activeTab = "all";
  let searchQuery = "";
  let showShareModal = false;
  let showCancelModal = false;
  let isDeleting = false;
  let eventData = data.event;

  // Accordion states for warnings
  let editWarningExpanded = false;
  let cancelWarningExpanded = false;

  // Payment method analytics
  let solanaRevenue = 0;
  let mobileMoneyRevenue = 0;
  let isLoadingPaymentBreakdown = false;

  function formatCurrency(amount: number) {
    return `NLe ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }

  // Reactive filtered guests
  $: filteredGuests = (() => {
    if (!eventData) return [];

    let filtered = eventData.guests || [];

    // Filter by tab (only if not "all")
    if (activeTab !== "all") {
    if (activeTab === "checked-in") {
        // Only show guests with checked-in status (handle both formats)
        filtered = filtered.filter((guest: any) => {
          const status = guest.status;
          return status === "checked_in" || status === "checked-in";
        });
    } else if (activeTab === "pending") {
        // Only show guests with pending status
      filtered = filtered.filter((guest: any) => guest.status === "pending");
      } else if (activeTab === "confirmed") {
        // Only show guests with confirmed status
        filtered = filtered.filter(
          (guest: any) => guest.status === "confirmed"
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((guest: any) => {
        // Search in name
        const nameMatch =
          guest.name &&
          typeof guest.name === "string" &&
          guest.name.toLowerCase().includes(query);

        // Search in ticket type
        const ticketTypeMatch =
          guest.ticketType &&
          typeof guest.ticketType === "string" &&
          guest.ticketType.toLowerCase().includes(query);

        // Search in status (handle both formats)
        const statusNormalized = guest.status
          ? guest.status.toLowerCase().replace(/[-_]/g, "")
          : "";
        const statusMatch =
          statusNormalized.includes(query.replace(/[-_]/g, "")) ||
          (guest.status &&
            typeof guest.status === "string" &&
            guest.status.toLowerCase().includes(query));

        return nameMatch || ticketTypeMatch || statusMatch;
      });
    }

    return filtered;
  })();

  function editEvent() {
    // Prevent editing if event has sales
    if (!eventData) return;

    if (hasSales) {
      alert(
        `This event cannot be edited because it has active ticket sales.\n\n` +
          `Tickets Sold: ${eventData.ticketsSold || 0}\n` +
          `Total Revenue: ${eventData.totalRevenue ? formatCurrency(eventData.totalRevenue) : formatCurrency(0)}\n\n` +
          `Editing event details (date, location, price, etc.) after tickets have been sold could impact buyers.\n\n` +
          `Please contact support if you need to make changes to this event.`
      );
      return;
    }

    const eventId = eventData.id;
    goto(`/dashboard/events/editEvent/${eventId}`);
  }

  function openShareModal() {
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
  }

  // Check if event has sales (tickets sold or revenue)
  $: hasSales = eventData
    ? (eventData.ticketsSold || 0) > 0 || (eventData.totalRevenue || 0) > 0
    : false;

  // Load payment method breakdown
  async function loadPaymentBreakdown() {
    if (!eventData?.id) return;

    isLoadingPaymentBreakdown = true;
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, payment_method")
        .eq("event_id", eventData.id)
        .in("payment_status", ["paid", "completed"]);

      if (error) {
        console.error("Error loading payment breakdown:", error);
        return;
      }

      solanaRevenue = 0;
      mobileMoneyRevenue = 0;

      (orders || []).forEach((order: any) => {
        const amount =
          typeof order.total_amount === "string"
            ? parseFloat(order.total_amount)
            : order.total_amount || 0;

        if (order.payment_method === "solana") {
          solanaRevenue += isFinite(amount) ? amount : 0;
        } else if (
          order.payment_method === "orange_money" ||
          order.payment_method === "afrimoney"
        ) {
          mobileMoneyRevenue += isFinite(amount) ? amount : 0;
        }
      });
    } catch (err) {
      console.error("Error loading payment breakdown:", err);
    } finally {
      isLoadingPaymentBreakdown = false;
    }
  }

  // Load payment breakdown on mount
  onMount(() => {
    loadPaymentBreakdown();
  });

  function openCancelModal() {
    // Prevent opening modal if event has sales
    if (hasSales) {
      alert(
        `This event cannot be canceled because it has active ticket sales.\n\n` +
          `Tickets Sold: ${eventData?.ticketsSold || 0}\n` +
          `Total Revenue: ${eventData?.totalRevenue ? formatCurrency(eventData.totalRevenue) : formatCurrency(0)}\n\n` +
          `Please contact support if you need to cancel this event.`
      );
      return;
    }
    showCancelModal = true;
  }

  function closeCancelModal() {
    showCancelModal = false;
  }

  async function handleCancelEvent() {
    if (isDeleting || !eventData) return;

    // Additional safety check before proceeding
    if (hasSales) {
      alert(
        `Cannot cancel event: This event has active ticket sales.\n\n` +
          `Tickets Sold: ${eventData.ticketsSold || 0}\n` +
          `Total Revenue: ${eventData.totalRevenue ? formatCurrency(eventData.totalRevenue) : formatCurrency(0)}\n\n` +
          `Please contact support for assistance.`
      );
      showCancelModal = false;
      return;
    }

    isDeleting = true;

    try {
      const result = await deleteEvent(eventData.id);

      if (result.success) {
        // Redirect to events list after successful deletion
        goto("/dashboard/events");
      } else {
        alert(`Failed to cancel event: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error cancelling event: ${error.message}`);
    } finally {
      isDeleting = false;
      showCancelModal = false;
    }
  }
</script>

{#if data.error}
  <div class="text-center py-12" in:fade={{ duration: 300 }}>
    <svg
      class="mx-auto h-12 w-12 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
    <h3 class="mt-2 text-sm font-medium text-red-300">Error Loading Event</h3>
    <p class="mt-1 text-sm text-gray-500">
      {data.error}
    </p>
    <button
      on:click={() => goto("/dashboard/events")}
      class="mt-4 bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors duration-200"
    >
      Back to Events
    </button>
  </div>
{:else if eventData}
  <div class="space-y-6" in:fade={{ duration: 300 }}>
    <!-- Back Navigation -->
    <div class="flex items-center mb-4">
      <button
        on:click={() => goto("/dashboard/events")}
        class="flex items-center text-gray-300 hover:text-white transition-colors duration-200 group"
      >
        <svg
          class="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
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
        <span class="text-sm font-medium">Back to Events</span>
      </button>
    </div>

    <!-- Event Banner with Cover Photo and Overlay Image -->
    <div class="relative h-40 sm:h-48 md:h-56 rounded-lg overflow-hidden">
      <!-- Cover Photo Background with Blur -->
      <img
        src={eventData.image}
        alt={eventData.title}
        class="w-full h-full object-cover blur-sm sm:blur-md"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
      ></div>

      <!-- Overlay Content Container -->
      <div
        class="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 right-3 sm:right-4 md:right-6 flex items-end gap-2 sm:gap-4 md:gap-6"
      >
        <!-- Smaller Event Image (Overlay) -->
        <div class="relative flex-shrink-0">
          <img
            src={eventData.image}
            alt={eventData.title}
            class="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-lg border-2 sm:border-2 md:border-4 border-white/20 shadow-xl sm:shadow-2xl object-cover"
          />
        </div>

        <!-- Event Title and Date -->
        <div class="flex-1 min-w-0 pb-0.5 sm:pb-1 md:pb-2 text-white">
          <h1
            class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 line-clamp-2 sm:truncate"
          >
            {eventData.title}
          </h1>
          <p
            class="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-gray-200 line-clamp-1"
          >
            {eventData.date}
          </p>
        </div>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 0 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {eventData.ticketsSold} / {eventData.totalCapacity}
        </div>
        <div class="text-sm text-gray-400">TICKETS SOLD</div>
      </div>

      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 100 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {formatCurrency(eventData.totalRevenue)}
        </div>
        <div class="text-sm text-gray-400">TOTAL REVENUE</div>
      </div>

      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 200 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {eventData.attendeesCheckedIn}
        </div>
        <div class="text-sm text-gray-400">ATTENDEES CHECKED IN</div>
      </div>

      <div
        class="bg-gray-800 rounded-lg p-6"
        in:fly={{ y: 20, duration: 300, delay: 300 }}
      >
        <div class="text-3xl font-bold text-teal-400 mb-2">
          {eventData.remainingTickets}
        </div>
        <div class="text-sm text-gray-400">REMAINING TICKETS</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Event Information -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 400 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Event Information</h2>
          <div class="space-y-4">
            <div class="flex items-center text-gray-300">
              <svg
                class="w-5 h-5 mr-3 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{eventData.date}</span>
            </div>
            <div class="flex items-center text-gray-300">
              <svg
                class="w-5 h-5 mr-3 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{eventData.time}</span>
            </div>
            <div class="flex items-center text-gray-300">
              <svg
                class="w-5 h-5 mr-3 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{eventData.location}</span>
            </div>
          </div>
          <p class="text-gray-300 mt-4 leading-relaxed">
            {eventData.description}
          </p>
        </div>

        <!-- Ticket Types -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 500 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Ticket Types</h2>
          <div class="space-y-4">
            {#each eventData.ticketTypes as ticket}
              <div
                class="flex justify-between items-center p-4 bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 class="font-semibold text-white">{ticket.name}</h3>
                  <p class="text-sm text-gray-400">
                    Sold: {ticket.sold} Remaining: {ticket.remaining}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold text-teal-400">
                    {formatCurrency(ticket.price)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Sales Analytics -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 600 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Sales Analytics</h2>

          <!-- Sales Overview -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <!-- Sales Progress -->
            <div class="bg-gray-700/50 rounded-lg p-4 sm:p-5">
              <div class="text-xs sm:text-sm text-gray-400 mb-2">
                Sales Progress
              </div>
              <div class="text-xl sm:text-2xl font-bold text-teal-400 mb-2">
                {Math.round(
                  (eventData.ticketsSold / (eventData.totalCapacity || 1)) * 100
                )}%
              </div>
              <div class="w-full bg-gray-600 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style="width: {Math.min(
                    (eventData.ticketsSold / (eventData.totalCapacity || 1)) *
                      100,
                    100
                  )}%"
                ></div>
              </div>
            </div>

            <!-- Average Ticket Price -->
            <div class="bg-gray-700/50 rounded-lg p-4 sm:p-5">
              <div class="text-xs sm:text-sm text-gray-400 mb-2">
                Avg. Ticket Price
              </div>
              <div class="text-xl sm:text-2xl font-bold text-purple-400">
                {eventData.ticketsSold > 0
                  ? formatCurrency(
                      eventData.totalRevenue / eventData.ticketsSold
                    )
                  : formatCurrency(0)}
              </div>
            </div>
          </div>

          <!-- Ticket Type Sales Breakdown - Bar Chart -->
          <div class="space-y-4">
            <h3
              class="text-sm sm:text-base font-semibold text-gray-300 mb-3 sm:mb-4"
            >
              Sales by Ticket Type
            </h3>
            <div class="space-y-4">
              {#each eventData.ticketTypes as ticket}
                <div class="space-y-2">
                  <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm"
                  >
                    <span class="text-gray-300 font-medium truncate"
                      >{ticket.name}</span
                    >
                    <div class="flex items-center gap-2 sm:gap-3">
                      <span class="text-gray-400 whitespace-nowrap">
                        {ticket.sold || 0} / {ticket.quantity || 0}
                      </span>
                      <span
                        class="text-teal-400 font-semibold whitespace-nowrap"
                      >
                        {ticket.quantity > 0
                          ? Math.round((ticket.sold / ticket.quantity) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                  <!-- Bar Chart -->
                  <div
                    class="relative w-full bg-gray-700 rounded-lg h-8 sm:h-10 overflow-hidden"
                  >
                    <div
                      class="absolute inset-0 flex flex-col sm:flex-row items-start sm:items-center px-2 sm:px-3 text-[10px] sm:text-xs font-medium text-white z-10 gap-0.5 sm:gap-0"
                    >
                      <span class="flex-1 truncate pr-2"
                        >{formatCurrency(
                          (ticket.sold || 0) * (ticket.price || 0)
                        )}</span
                      >
                      <span class="text-gray-300 whitespace-nowrap"
                        >{ticket.sold || 0} sold</span
                      >
                    </div>
                    <div
                      class="h-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 rounded-lg transition-all duration-700 ease-out"
                      style="width: {ticket.quantity > 0
                        ? Math.min((ticket.sold / ticket.quantity) * 100, 100)
                        : 0}%"
                    ></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Payment Method Breakdown - Donut Chart -->
          <div class="mt-6 pt-6 border-t border-gray-700">
            <h3
              class="text-sm sm:text-base font-semibold text-gray-300 mb-4 sm:mb-6"
            >
              Revenue by Payment Method
            </h3>
            {#if isLoadingPaymentBreakdown}
              <div class="flex items-center justify-center h-32 sm:h-40">
                <div
                  class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-teal-400"
                ></div>
              </div>
            {:else if solanaRevenue === 0 && mobileMoneyRevenue === 0}
              <p class="text-xs sm:text-sm text-gray-500 text-center py-8">
                No payment data available
              </p>
            {:else}
              {@const totalRev =
                eventData.totalRevenue || solanaRevenue + mobileMoneyRevenue}
              {@const solanaPercent =
                totalRev > 0 ? (solanaRevenue / totalRev) * 100 : 0}
              {@const mobilePercent =
                totalRev > 0 ? (mobileMoneyRevenue / totalRev) * 100 : 0}
              {@const circumference = 2 * Math.PI * 45}
              <!-- radius = 45 -->
              {@const solanaDashoffset =
                circumference - (solanaPercent / 100) * circumference}
              {@const mobileDashoffset =
                circumference - (mobilePercent / 100) * circumference}

              <div
                class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
              >
                <!-- Donut Chart -->
                <div
                  class="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0"
                >
                  <svg
                    class="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <!-- Background Circle -->
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgb(55, 65, 81)"
                      stroke-width="8"
                    />
                    <!-- Solana Segment (First) -->
                    {#if solanaRevenue > 0}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#solanaGradient)"
                        stroke-width="8"
                        stroke-dasharray={circumference}
                        stroke-dashoffset={solanaDashoffset}
                        stroke-linecap="round"
                        class="transition-all duration-700 ease-out"
                      />
                    {/if}
                    <!-- Mobile Money Segment (Second, starts after Solana) -->
                    {#if mobileMoneyRevenue > 0}
                      {@const mobileStartAngle = (solanaPercent / 100) * 360}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#mobileGradient)"
                        stroke-width="8"
                        stroke-dasharray={circumference}
                        stroke-dashoffset={mobileDashoffset +
                          (solanaPercent / 100) * circumference}
                        stroke-linecap="round"
                        class="transition-all duration-700 ease-out"
                      />
                    {/if}
                    <!-- Gradients -->
                    <defs>
                      <linearGradient
                        id="solanaGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          style="stop-color:rgb(168, 85, 247);stop-opacity:1"
                        />
                        <stop
                          offset="100%"
                          style="stop-color:rgb(147, 51, 234);stop-opacity:1"
                        />
                      </linearGradient>
                      <linearGradient
                        id="mobileGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          style="stop-color:rgb(6, 182, 212);stop-opacity:1"
                        />
                        <stop
                          offset="100%"
                          style="stop-color:rgb(20, 184, 166);stop-opacity:1"
                />
                      </linearGradient>
                    </defs>
              </svg>
                  <!-- Center Text -->
                  <div
                    class="absolute inset-0 flex items-center justify-center"
                  >
                    <div class="text-center px-1">
                      <div
                        class="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white truncate max-w-full"
                      >
                        {formatCurrency(totalRev)}
                      </div>
                      <div class="text-[8px] sm:text-[10px] text-gray-400">
                        Total Revenue
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Legend -->
                <div
                  class="flex-1 w-full sm:w-auto space-y-2 sm:space-y-3 min-w-0"
                >
                  {#if solanaRevenue > 0}
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700/50 rounded-lg gap-2 sm:gap-0"
                    >
                      <div class="flex items-center gap-2 sm:gap-3">
                        <div
                          class="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex-shrink-0"
                        ></div>
                        <div class="min-w-0">
                          <div
                            class="text-xs sm:text-sm font-medium text-gray-300 truncate"
                          >
                            Solana
                          </div>
                          <div class="text-[10px] sm:text-xs text-gray-400">
                            {Math.round(solanaPercent)}% of revenue
                          </div>
                        </div>
                      </div>
                      <div
                        class="text-xs sm:text-sm font-bold text-purple-400 whitespace-nowrap sm:ml-4"
                      >
                        {formatCurrency(solanaRevenue)}
                      </div>
                    </div>
                  {/if}

                  {#if mobileMoneyRevenue > 0}
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-700/50 rounded-lg gap-2 sm:gap-0"
                    >
                      <div class="flex items-center gap-2 sm:gap-3">
                        <div
                          class="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex-shrink-0"
                        ></div>
                        <div class="min-w-0">
                          <div
                            class="text-xs sm:text-sm font-medium text-gray-300 truncate"
                          >
                            Mobile Money
                          </div>
                          <div class="text-[10px] sm:text-xs text-gray-400">
                            {Math.round(mobilePercent)}% of revenue
                          </div>
                        </div>
                      </div>
                      <div
                        class="text-xs sm:text-sm font-bold text-cyan-400 whitespace-nowrap sm:ml-4"
                      >
                        {formatCurrency(mobileMoneyRevenue)}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Quick Stats -->
          <div
            class="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
          >
            <div class="text-center">
              <div
                class="text-base sm:text-lg md:text-xl font-bold text-teal-400"
              >
                {eventData.ticketsSold || 0}
              </div>
              <div class="text-[10px] sm:text-xs text-gray-400 mt-1">
                Total Sold
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-base sm:text-lg md:text-xl font-bold text-purple-400"
              >
                {eventData.remainingTickets || 0}
              </div>
              <div class="text-[10px] sm:text-xs text-gray-400 mt-1">
                Available
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-base sm:text-lg md:text-xl font-bold text-cyan-400 truncate"
              >
                {formatCurrency(eventData.totalRevenue || 0)}
              </div>
              <div class="text-[10px] sm:text-xs text-gray-400 mt-1">
                Total Revenue
              </div>
            </div>
            <div class="text-center">
              <div
                class="text-base sm:text-lg md:text-xl font-bold text-yellow-400"
              >
                {eventData.ticketsSold > 0
                  ? Math.round(
                      ((eventData.attendeesCheckedIn || 0) /
                        eventData.ticketsSold) *
                        100
                    )
                  : 0}%
              </div>
              <div class="text-[10px] sm:text-xs text-gray-400 mt-1">
                Check-in Rate
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-6">
        <!-- Event Actions -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 700 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Event Actions</h2>
          <div class="space-y-3">
            <button
              on:click={editEvent}
              disabled={hasSales}
              class="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                {hasSales
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-purple-600 text-white hover:opacity-90'}"
              title={hasSales
                ? `Cannot edit: Event has ${eventData?.ticketsSold || 0} ticket(s) sold and ${eventData?.totalRevenue ? formatCurrency(eventData.totalRevenue) : formatCurrency(0)} in revenue`
                : "Edit this event"}
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {#if hasSales}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                {:else}
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
                {/if}
              </svg>
              {hasSales ? "Edit Event (Disabled)" : "Edit Event"}
            </button>
            {#if hasSales}
              <div
                class="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg overflow-hidden transition-all duration-200"
              >
                <button
                  on:click={() => (editWarningExpanded = !editWarningExpanded)}
                  class="w-full flex items-center justify-between p-3 text-left hover:bg-yellow-500/5 transition-colors duration-200"
                >
                  <div class="flex items-center">
                    <svg
                      class="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span class="text-xs font-semibold text-yellow-300">
                      Event editing is disabled
                    </span>
                  </div>
                  <svg
                    class="w-4 h-4 text-yellow-400 transition-transform duration-200 {editWarningExpanded
                      ? 'rotate-180'
                      : ''}"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {#if editWarningExpanded}
                  <div
                    class="px-3 pb-3 pt-0"
                    transition:slide={{ axis: "y", duration: 200 }}
                  >
                    <p class="text-xs text-yellow-400/80 mt-2">
                      This event cannot be edited because it has active ticket
                      sales ({eventData?.ticketsSold || 0} ticket{eventData?.ticketsSold !==
                      1
                        ? "s"
                        : ""} sold). Changing event details after tickets are sold
                      could impact buyers. Please contact support if you need assistance.
                    </p>
                  </div>
                {/if}
              </div>
            {/if}
            <button
              on:click={openShareModal}
              class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              Share Event
            </button>
            <button
              class="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Guest List
            </button>
            <button
              on:click={openCancelModal}
              disabled={hasSales}
              class="w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center
                {hasSales
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'}"
              title={hasSales
                ? `Cannot cancel: Event has ${eventData?.ticketsSold || 0} ticket(s) sold and ${eventData?.totalRevenue ? formatCurrency(eventData.totalRevenue) : formatCurrency(0)} in revenue`
                : "Cancel this event"}
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {#if hasSales}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                {:else}
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
                {/if}
              </svg>
              {hasSales ? "Cancel Event (Disabled)" : "Cancel Event"}
            </button>
            {#if hasSales}
              <div
                class="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg overflow-hidden transition-all duration-200"
              >
                <button
                  on:click={() =>
                    (cancelWarningExpanded = !cancelWarningExpanded)}
                  class="w-full flex items-center justify-between p-3 text-left hover:bg-yellow-500/5 transition-colors duration-200"
                >
                  <div class="flex items-center">
                    <svg
                      class="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span class="text-xs font-semibold text-yellow-300">
                      Event cancellation is disabled
                    </span>
                  </div>
                  <svg
                    class="w-4 h-4 text-yellow-400 transition-transform duration-200 {cancelWarningExpanded
                      ? 'rotate-180'
                      : ''}"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {#if cancelWarningExpanded}
                  <div
                    class="px-3 pb-3 pt-0"
                    transition:slide={{ axis: "y", duration: 200 }}
                  >
                    <p class="text-xs text-yellow-400/80 mt-2">
                      This event cannot be canceled because it has active ticket
                      sales ({eventData?.ticketsSold || 0} ticket{eventData?.ticketsSold !==
                      1
                        ? "s"
                        : ""} sold). Please contact support if you need assistance.
                    </p>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- QR Code -->
        <div
          class="bg-gray-800 rounded-lg p-6"
          in:fly={{ y: 20, duration: 300, delay: 800 }}
        >
          <h2 class="text-xl font-bold text-white mb-4">Event QR Code</h2>
          <div class="text-center">
            {#if eventData?.id}
              {@const eventLink =
                typeof window !== "undefined"
                  ? `${window.location.origin}/marketplace/eventDetails/${eventData.id}`
                  : ""}
              {@const qrCodeUrl = eventLink
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventLink)}`
                : ""}

              <div
                class="bg-white p-3 sm:p-4 rounded-lg mx-auto mb-4 inline-block"
              >
                {#if qrCodeUrl}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for {eventData.title || 'event'}"
                    class="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
                    loading="lazy"
                  />
                {:else}
                  <div
                    class="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-16 h-16 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
                {/if}
              </div>

              <p class="text-gray-300 text-xs sm:text-sm mb-4 px-2">
                Scan this QR code to view the event page
            </p>

            <button
                on:click={() => {
                  if (qrCodeUrl && typeof window !== "undefined") {
                    const link = document.createElement("a");
                    link.href = qrCodeUrl;
                    link.download = `qr-code-${eventData.title?.replace(/\s+/g, "-").toLowerCase() || "event"}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={!qrCodeUrl}
                class="w-full bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
            >
              <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download QR Code
            </button>
            {:else}
              <div
                class="w-32 h-32 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center"
              >
                <svg
                  class="w-16 h-16 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <p class="text-gray-400 text-xs sm:text-sm mb-4">
                Event data not available
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Guest List -->
    <div
      class="bg-gray-800 rounded-lg p-6"
      in:fly={{ y: 20, duration: 300, delay: 900 }}
    >
      <h2 class="text-xl font-bold text-white mb-4">Guest List</h2>

      <!-- Search Input -->
      <div class="relative mb-6">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <svg
            class="h-5 w-5 text-gray-400"
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
          placeholder="Search guests by name, ticket type, or status..."
          class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      <!-- Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          on:click={() => (activeTab = "all")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base {activeTab ===
          'all'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          All
        </button>
        <button
          on:click={() => (activeTab = "checked-in")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base {activeTab ===
          'checked-in'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          Checked In
        </button>
        <button
          on:click={() => (activeTab = "pending")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base {activeTab ===
          'pending'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          Pending
        </button>
        <button
          on:click={() => (activeTab = "confirmed")}
          class="px-4 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base {activeTab ===
          'confirmed'
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          Confirmed
        </button>
      </div>

      <!-- Guest Count and Table -->
      {#if true}
        <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div class="text-sm text-gray-400">
            Showing <span class="text-white font-semibold"
              >{filteredGuests.length}</span
            >
            of{" "}
            <span class="text-white font-semibold"
              >{eventData.guests?.length || 0}</span
            >
            guest{eventData.guests?.length !== 1 ? "s" : ""}
          </div>
          {#if (searchQuery || activeTab !== "all") && filteredGuests.length === 0}
            <button
              on:click={() => {
                searchQuery = "";
                activeTab = "all";
              }}
              class="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              Clear filters
            </button>
          {/if}
        </div>

        <!-- Guest Table - Desktop -->
        {#if filteredGuests.length > 0}
          <div
            class="hidden md:block max-h-[600px] overflow-y-auto overflow-x-auto"
          >
        <table class="w-full">
              <thead class="sticky top-0 bg-gray-800 z-10">
            <tr class="border-b border-gray-700">
                  <th
                    class="text-left py-3 px-4 text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider bg-gray-800"
                  >
                    Name
                  </th>
                  <th
                    class="text-left py-3 px-4 text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider bg-gray-800"
                  >
                    Ticket Type
                  </th>
                  <th
                    class="text-left py-3 px-4 text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider bg-gray-800"
                  >
                    Status
                  </th>
            </tr>
          </thead>
          <tbody>
                {#each filteredGuests as guest}
              <tr
                    class="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200"
              >
                    <td class="py-4 px-4">
                  <div class="flex items-center">
                    <img
                      src={guest.avatar}
                      alt={guest.name}
                          class="w-10 h-10 rounded-full mr-3 object-cover"
                          on:error={(e) => {
                            if (e.currentTarget instanceof HTMLImageElement) {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guest.name)}&background=14b8a6&color=fff&size=128`;
                            }
                          }}
                        />
                        <div>
                          <div class="text-white font-medium text-sm">
                            {guest.name}
                          </div>
                          {#if guest.id}
                            <div class="text-xs text-gray-500 font-mono mt-0.5">
                              {guest.id.substring(0, 8)}...
                            </div>
                          {/if}
                        </div>
                  </div>
                </td>
                    <td class="py-4 px-4">
                      <span class="text-gray-300 text-sm"
                        >{guest.ticketType || "Standard"}</span
                  >
                </td>
                    <td class="py-4 px-4">
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-medium {guest.status ===
                          'checked_in' || guest.status === 'checked-in'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : guest.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : guest.status === 'confirmed'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}"
                      >
                        {guest.status === "checked_in" ||
                        guest.status === "checked-in"
                          ? "✓ Checked In"
                          : guest.status === "pending"
                            ? "⏳ Pending"
                            : guest.status === "confirmed"
                              ? "✓ Confirmed"
                              : guest.status || "Unknown"}
                      </span>
                    </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

          <!-- Guest Cards - Mobile -->
          <div class="md:hidden max-h-[600px] overflow-y-auto space-y-3">
            {#each filteredGuests as guest}
              <div
                class="bg-gray-700/50 rounded-lg p-4 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-200"
              >
                <div class="flex items-start gap-3">
                  <img
                    src={guest.avatar}
                    alt={guest.name}
                    class="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    on:error={(e) => {
                      if (e.currentTarget instanceof HTMLImageElement) {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(guest.name)}&background=14b8a6&color=fff&size=128`;
                      }
                    }}
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-2">
                      <h3 class="text-white font-medium text-sm truncate">
                        {guest.name}
                      </h3>
                      <span
                        class="px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0 {guest.status ===
                          'checked_in' || guest.status === 'checked-in'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : guest.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : guest.status === 'confirmed'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}"
                      >
                        {guest.status === "checked_in" ||
                        guest.status === "checked-in"
                          ? "✓ Checked In"
                          : guest.status === "pending"
                            ? "⏳ Pending"
                            : guest.status === "confirmed"
                              ? "✓ Confirmed"
                              : guest.status || "Unknown"}
                      </span>
                    </div>
                    <div class="text-xs text-gray-400 mb-1">
                      <span class="font-medium text-gray-300">Ticket:</span>
                      {guest.ticketType || "Standard"}
                    </div>
                    {#if guest.id}
                      <div
                        class="text-[10px] text-gray-500 font-mono mt-1 truncate"
                      >
                        ID: {guest.id.substring(0, 12)}...
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Empty State -->
          <div
            class="bg-gray-700/30 border border-gray-700/50 rounded-lg p-8 sm:p-12 text-center"
          >
            <svg
              class="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-300 mb-2">
              {searchQuery || activeTab !== "all"
                ? "No guests match your filters"
                : "No guests yet"}
            </h3>
            <p class="text-sm text-gray-500 mb-4">
              {searchQuery || activeTab !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Guests will appear here once they register for this event"}
            </p>
            {#if searchQuery || activeTab !== "all"}
              <button
                on:click={() => {
                  searchQuery = "";
                  activeTab = "all";
                }}
                class="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                Clear all filters
              </button>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Share Event Modal -->
  <ShareEventModal
    event={eventData}
    isOpen={showShareModal}
    on:close={closeShareModal}
  />

  <!-- Cancel Event Confirmation Modal -->
  {#if showCancelModal}
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      in:fade={{ duration: 200 }}
    >
      <div
        class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        in:fly={{ y: 20, duration: 200 }}
      >
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0">
            <svg
              class="h-8 w-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-white">Cancel Event</h3>
          </div>
        </div>

        <div class="mb-6">
          <p class="text-gray-300">
            Are you sure you want to cancel <strong class="text-white"
              >{eventData.title}</strong
            >?
          </p>
          <p class="text-red-400 text-sm mt-2">
            This action cannot be undone. All event data, guest information, and
            the event image will be permanently deleted.
          </p>
        </div>

        <div class="flex space-x-3">
          <button
            on:click={closeCancelModal}
            disabled={isDeleting}
            class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Event
          </button>
          <button
            on:click={handleCancelEvent}
            disabled={isDeleting}
            class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {#if isDeleting}
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Cancelling...
            {:else}
              Cancel Event
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="text-center py-12" in:fade={{ duration: 300 }}>
    <svg
      class="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
    <h3 class="mt-2 text-sm font-medium text-gray-300">Event Not Found</h3>
    <p class="mt-1 text-sm text-gray-500">
      The requested event could not be found.
    </p>
    <button
      on:click={() => goto("/dashboard/events")}
      class="mt-4 bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors duration-200"
    >
      Back to Events
    </button>
  </div>
{/if}

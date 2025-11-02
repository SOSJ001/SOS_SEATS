<script>
  // @ts-nocheck
  import { getDomain, sessionFromDb, updatedEventsData } from "$lib/store";
  import { invalidateAll, goto } from "$app/navigation";
  import DashboardOverview from "$lib/components/DashboardOverview.svelte";
  import DashboardRecentActivity from "$lib/components/DashboardRecentActivity.svelte";
  import { fade } from "svelte/transition";

  export let data;

  if (data.user_Id !== undefined) {
    sessionFromDb.set(data.user_Id);
  }

  // Get event data
  let EventTableResult = data.EventTableResult;
  const dashboardStats = data.dashboardStats || {
    liveEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    guestsCheckedIn: 0,
  };

  // Helper function to format currency
  function formatCurrency(amount) {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount >= 1000000) {
      return `NLe ${(numAmount / 1000000).toFixed(2)}M`;
    } else if (numAmount >= 1000) {
      return `NLe ${(numAmount / 1000).toFixed(0)}k`;
    } else {
      return `NLe ${numAmount.toFixed(2)}`;
    }
  }

  // Calculate dashboard metrics dynamically
  $: dashboardMetrics = [
    {
      icon: "calendar",
      value: dashboardStats.liveEvents.toString(),
      label: "LIVE EVENTS",
      color: "teal",
    },
    {
      icon: "ticket",
      value: dashboardStats.totalTicketsSold.toLocaleString(),
      label: "TICKETS SOLD",
      color: "blue",
    },
    {
      icon: "currency",
      value: formatCurrency(dashboardStats.totalRevenue),
      label: "TOTAL REVENUE",
      color: "green",
    },
    {
      icon: "users",
      value: dashboardStats.guestsCheckedIn.toLocaleString(),
      label: "GUESTS CHECKED IN",
      color: "purple",
    },
  ];

  // Temporary fallback metrics for testing
  $: fallbackMetrics = [
    {
      icon: "calendar",
      value: "0",
      label: "LIVE EVENTS",
      color: "teal",
    },
    {
      icon: "ticket",
      value: "0",
      label: "TICKETS SOLD",
      color: "blue",
    },
    {
      icon: "currency",
      value: "$0",
      label: "TOTAL REVENUE",
      color: "green",
    },
    {
      icon: "users",
      value: "0",
      label: "GUESTS CHECKED IN",
      color: "purple",
    },
  ];

  // Use fallback if dashboardMetrics is empty or undefined
  $: displayMetrics =
    dashboardMetrics && dashboardMetrics.length > 0
      ? dashboardMetrics
      : fallbackMetrics;

  // Get recent activities from server data
  const recentActivities = data.recentActivities || [];

  // Use real activities if available, otherwise show empty array for proper empty state handling
  $: displayActivities = recentActivities;

  // Quick action handlers
  let isNavigating = false;

  async function handleCreateEvent() {
    if (isNavigating) return;
    isNavigating = true;
    await goto("/dashboard/events/createEvent");
    isNavigating = false;
  }

  async function handleScanQR() {
    if (isNavigating) return;
    isNavigating = true;
    await goto("/dashboard/scanner");
    isNavigating = false;
  }

  async function handleManageGuests() {
    if (isNavigating) return;
    isNavigating = true;
    await goto("/dashboard/guests");
    isNavigating = false;
  }
</script>

<svelte:head>
  <title>Dashboard - SOS SEATS</title>
</svelte:head>

<div class="space-y-8">
  <!-- Dashboard Overview -->
  <DashboardOverview metrics={displayMetrics} />

  <!-- Recent Activity -->
  <DashboardRecentActivity activities={displayActivities} />

  <!-- Quick Actions Section -->
  <div
    class="bg-gray-800 border border-gray-700 rounded-lg p-6"
    in:fade={{ duration: 500, delay: 400 }}
  >
    <h2 class="text-2xl font-bold text-white mb-6">Quick Actions</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        class="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        on:click={handleCreateEvent}
        disabled={isNavigating}
      >
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Create Event</span>
        </div>
      </button>

      <button
        class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        on:click={handleScanQR}
        disabled={isNavigating}
      >
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Scan QR Code</span>
        </div>
      </button>

      <button
        class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        on:click={handleManageGuests}
        disabled={isNavigating}
      >
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Manage Guests</span>
        </div>
      </button>
    </div>
  </div>
</div>

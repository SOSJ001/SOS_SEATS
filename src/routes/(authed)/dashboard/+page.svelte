<script>
  // @ts-nocheck
  import { getDomain, sessionFromDb, updatedEventsData } from "$lib/store.js";
  import { invalidateAll } from "$app/navigation";
  import DashboardOverview from "$lib/components/DashboardOverview.svelte";
  import DashboardRecentActivity from "$lib/components/DashboardRecentActivity.svelte";
  import { fade } from "svelte/transition";

  export let data;

  if (data.user_Id !== undefined) {
    sessionFromDb.set(data.user_Id);
  }

  // Get event data
  let EventTableResult = data.EventTableResult;

  // Calculate dashboard metrics
  $: dashboardMetrics = [
    {
      icon: "calendar",
      value: EventTableResult ? EventTableResult.length.toString() : "0",
      label: "LIVE EVENTS",
      color: "teal",
    },
    {
      icon: "ticket",
      value: "5,432",
      label: "TICKETS SOLD",
      color: "blue",
    },
    {
      icon: "currency",
      value: "$125k",
      label: "TOTAL REVENUE",
      color: "green",
    },
    {
      icon: "users",
      value: "4,890",
      label: "GUESTS CHECKED IN",
      color: "purple",
    },
  ];

  // Recent activity data
  let recentActivities = [
    {
      icon: "ticket",
      message: "Ticket Sold: VIP Pass for Summer Fest",
      time: "2 minutes ago",
    },
    {
      icon: "users",
      message: "New Guest Registered: Jane Doe",
      time: "1 hour ago",
    },
    {
      icon: "calendar",
      message: "New Event Created: Winter Gala",
      time: "Yesterday",
    },
    {
      icon: "currency",
      message: "Revenue Payout Processed",
      time: "3 days ago",
    },
  ];

  // Update activities based on real data if available
  $: {
    if (EventTableResult && EventTableResult.length > 0) {
      // Update the first activity with real event data
      const latestEvent = EventTableResult[0];
      if (latestEvent && latestEvent.Event) {
        recentActivities[2] = {
          icon: "calendar",
          message: `New Event Created: ${latestEvent.Event.name}`,
          time: "Recently",
        };
      }
    }
  }
</script>

<div class="space-y-8">
  <!-- Dashboard Overview -->
  <DashboardOverview {dashboardMetrics} />

  <!-- Recent Activity -->
  <DashboardRecentActivity activities={recentActivities} />

  <!-- Quick Actions Section -->
  <div
    class="bg-gray-800 border border-gray-700 rounded-lg p-6"
    in:fade={{ duration: 500, delay: 400 }}
  >
    <h2 class="text-2xl font-bold text-white mb-6">Quick Actions</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        class="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
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
        class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
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
        class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
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

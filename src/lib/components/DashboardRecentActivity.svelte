<script>
  import DashboardActivityItem from "./DashboardActivityItem.svelte";
  import { fade } from "svelte/transition";
  
  export let activities = [
    { icon: "ticket", message: "Ticket Sold: VIP Pass for Summer Fest", time: "2 minutes ago" },
    { icon: "users", message: "New Guest Registered: Jane Doe", time: "1 hour ago" },
    { icon: "calendar", message: "New Event Created: Winter Gala", time: "Yesterday" },
    { icon: "currency", message: "Revenue Payout Processed", time: "3 days ago" }
  ];
</script>

<div class="bg-gray-800 border border-gray-700 rounded-lg p-6" in:fade={{ duration: 500, delay: 200 }}>
  <h2 class="text-2xl font-bold text-white mb-6">Recent Activity</h2>
  
  <div class="space-y-6">
    {#each activities as activity, index}
      <div class="relative">
        <DashboardActivityItem
          icon={activity.icon}
          message={activity.message}
          time={activity.time}
          delay={index * 100}
        />
        {#if index < activities.length - 1}
          <div class="absolute left-6 top-8 w-0.5 h-8 bg-gray-600"></div>
        {/if}
      </div>
    {/each}
  </div>
</div> 
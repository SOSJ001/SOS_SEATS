<script>
  import DashboardActivityItem from "./DashboardActivityItem.svelte";
  import { fade } from "svelte/transition";

  /** @type {Array<{icon: string, message: string, time: string, details?: string}>} */
  export let activities = [];
</script>

<div
  class="bg-gray-800 border border-gray-700 rounded-lg p-6"
  in:fade={{ duration: 500, delay: 200 }}
>
  <h2 class="text-2xl font-bold text-white mb-6">Recent Activity</h2>

  <div class="space-y-6">
    {#if activities && activities.length > 0}
      {#each activities as activity, index}
        <div class="relative">
          <DashboardActivityItem
            icon={activity.icon}
            message={activity.message}
            time={activity.time}
            details={activity.details || ""}
            delay={index * 100}
          />
          {#if index < activities.length - 1}
            <div class="absolute left-6 top-8 w-0.5 h-8 bg-gray-600"></div>
          {/if}
        </div>
      {/each}
    {:else}
      <div class="text-center py-12">
        <div
          class="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            class="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-300 mb-2">
          No Recent Activity
        </h3>
        <p class="text-gray-400 text-sm mb-4">
          Recent ticket sales, guest check-ins, and event updates will appear
          here.
        </p>
        <div class="text-xs text-gray-500 space-y-1">
          <p>• Create and publish events to start selling tickets</p>
          <p>• Check in guests at your events</p>
          <p>• Monitor your event performance</p>
        </div>
      </div>
    {/if}
  </div>
</div>

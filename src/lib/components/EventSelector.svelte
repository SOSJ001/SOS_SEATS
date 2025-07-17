<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let events: Array<{ id: string; title: string }> = [];
  export let selectedEvent: string = "all";

  function handleEventChange(eventId: string) {
    selectedEvent = eventId;
    dispatch("eventChange", { eventId });
  }
</script>

<div class="mb-6">
  <label class="block text-sm font-medium text-gray-300 mb-2">
    Select Event
  </label>
  <div class="relative">
    <select
      bind:value={selectedEvent}
      on:change={() => handleEventChange(selectedEvent)}
      class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent appearance-none"
    >
      <option value="all">All Events</option>
      {#each events as event}
        <option value={event.id}>{event.title}</option>
      {/each}
    </select>
    <div
      class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
    >
      <svg
        class="w-5 h-5 text-gray-400"
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
    </div>
  </div>
</div>

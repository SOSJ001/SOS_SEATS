<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let selectedEvent: string = "";
  export let events: Array<{ id: string; name: string; date: string }> = [];

  const dispatch = createEventDispatcher();

  function handleEventChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedEvent = target.value;
    dispatch("eventChange", { eventId: target.value });
  }
</script>

<div class="mb-4 sm:mb-6">
  <label
    for="event-select"
    class="block text-sm font-medium text-gray-300 mb-2"
  >
    Select Event to Scan
  </label>
  <select
    id="event-select"
    value={selectedEvent}
    on:change={handleEventChange}
    class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
  >
    <option value="all">All Events</option>
    {#each events as event}
      <option value={event.id}>{event.name}</option>
    {/each}
  </select>
</div>

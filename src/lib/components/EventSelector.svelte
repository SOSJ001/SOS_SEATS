<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  export let selectedEvent: string = "";

  // Internal options loaded the same way events dashboard loads
  let options: Array<{ id: string; name: string; date: string }> = [];
  let loading = false;

  const dispatch = createEventDispatcher();

  function handleEventChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedEvent = target.value;
    dispatch("eventChange", { eventId: target.value });
  }

  async function loadEventsFromApi() {
    try {
      loading = true;
      const response = await fetch("/loadUserEventsApi");
      if (!response.ok) return;
      const result = await response.json();
      if (result?.success && Array.isArray(result.events)) {
        options = result.events
          .filter(
            (e: any) =>
              e && e.id && (e.status === "published" || e.status === "live")
          )
          .map((e: any) => ({ id: e.id, name: e.name, date: e.date }));
        // Don't auto-select - let user explicitly choose an event
      } else {
        options = [];
      }
    } finally {
      loading = false;
    }
  }

  onMount(loadEventsFromApi);
  // Do not fall back to provided events; rely solely on API
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
    value={selectedEvent || ""}
    on:change={handleEventChange}
    class="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
  >
    <option value="" disabled={selectedEvent !== ""}>Select an event...</option>
    {#each options as event}
      <option value={event.id}>{event.name}</option>
    {/each}
  </select>
</div>

<script lang="ts">
  export let selectedEvent: string = "";
  export let events: Array<{ id: string; name: string; date: string }> = [];
  export let onEventChange: (eventId: string) => void = () => {};

  function handleEventChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onEventChange(target.value);
  }
</script>

<div class="mb-6">
  <label for="event-select" class="block text-sm font-medium text-gray-300 mb-2">
    Select Event to Scan
  </label>
  <select
    id="event-select"
    bind:value={selectedEvent}
    on:change={handleEventChange}
    class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
  >
    <option value="" disabled>Choose an event...</option>
    {#each events as event}
      <option value={event.id}>{event.name}</option>
    {/each}
  </select>
</div>

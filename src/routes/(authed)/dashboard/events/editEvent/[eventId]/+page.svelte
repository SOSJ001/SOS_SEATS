<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  // Get the event data from the server
  export let data;

  let eventData = data.event || {};
  let error = data.error || "";

  $: eventId = $page.params.eventId;

  onMount(() => {
    if (error) {
      // If there's an error, redirect back to events
      goto("/dashboard/events");
    } else if (eventData && Object.keys(eventData).length > 0) {
      // Redirect to step1 - each step will load its own data from server
      goto(`/dashboard/events/editEvent/${eventId}/step1`);
    } else {
      // No event data, redirect back to events
      goto("/dashboard/events");
    }
  });
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-900">
  <div class="text-center">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
    ></div>
    <p class="text-gray-300">Redirecting to edit event...</p>
  </div>
</div>

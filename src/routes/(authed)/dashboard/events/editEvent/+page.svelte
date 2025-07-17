<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let eventId = "";
  let isLoading = true;

  onMount(() => {
    // Get event ID from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    eventId = urlParams.get("id") || "";

    if (eventId) {
      // Load event data and redirect to edit flow
      loadEventData();
    } else {
      // No event ID provided, redirect back to events list
      goto("/dashboard/events");
    }
  });

  async function loadEventData() {
    try {
      // Here you would typically fetch event data from your API
      // For now, we'll simulate loading and redirect to the edit flow
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to the edit flow (you can create a multi-step edit flow similar to createEvent)
      goto(`/dashboard/events/editEvent/${eventId}`);
    } catch (error) {
      console.error("Error loading event:", error);
      goto("/dashboard/events");
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-900">
  <div class="text-center">
    {#if isLoading}
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
      ></div>
      <p class="text-gray-300">Loading event data...</p>
    {:else}
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
      ></div>
      <p class="text-gray-300">Redirecting to edit event...</p>
    {/if}
  </div>
</div>

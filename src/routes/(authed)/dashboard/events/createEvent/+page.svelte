<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    // Redirect to step 1 when the page loads
    goto("/dashboard/events/createEvent/step1");
  });
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-900">
  <div class="text-center">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
    ></div>
    <p class="text-gray-300">Redirecting to event creation...</p>
  </div>
</div>

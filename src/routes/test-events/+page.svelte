<script>
  import { onMount } from "svelte";

  let apiResponse = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const response = await fetch("/loadUserEventsApi");
      const result = await response.json();
      apiResponse = result;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-4">Events API Test</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="text-red-500">Error: {error}</p>
  {:else}
    <div class="space-y-4">
      <h2 class="text-xl font-semibold">API Response:</h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(
          apiResponse,
          null,
          2
        )}</pre>

      {#if apiResponse.success}
        <div class="mt-4">
          <h3 class="text-lg font-semibold">
            Events Found: {apiResponse.events.length}
          </h3>
          {#each apiResponse.events as event}
            <div class="border p-4 rounded mb-2">
              <p><strong>ID:</strong> {event.id}</p>
              <p><strong>Name:</strong> {event.name}</p>
              <p><strong>Status:</strong> {event.status}</p>
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>User ID:</strong> {event.user_id}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

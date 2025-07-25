<script>
  import { onMount } from "svelte";
  import { parseSession } from "$lib/sessionUtils.js";
  import { loadUserEvents } from "$lib/supabase.js";

  let sessionData = null;
  let allEvents = null;
  let userEvents = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      // Get session data from cookies
      const response = await fetch("/debug-session");
      const sessionResult = await response.json();
      sessionData = sessionResult;

      // Get all events from database
      const allEventsResponse = await fetch("/debug-all-events");
      const allEventsResult = await allEventsResponse.json();
      allEvents = allEventsResult;

      // Get user events
      if (sessionData.user_Id) {
        const userEventsResponse = await fetch("/loadUserEventsApi");
        const userEventsResult = await userEventsResponse.json();
        userEvents = userEventsResult;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Debug Events</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-6xl">
  <h1 class="text-3xl font-bold mb-6">Debug Events</h1>

  {#if loading}
    <div class="text-center py-8">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
      ></div>
      <p class="mt-4">Loading debug information...</p>
    </div>
  {:else if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      Error: {error}
    </div>
  {:else}
    <!-- Session Data -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Session Data</h2>
      <pre
        class="bg-gray-100 p-4 rounded overflow-auto text-sm">{JSON.stringify(
          sessionData,
          null,
          2
        )}</pre>
    </div>

    <!-- All Events in Database -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">All Events in Database</h2>
      {#if allEvents.success}
        <p class="mb-2">
          <strong>Total Events:</strong>
          {allEvents.events?.length || 0}
        </p>
        {#if allEvents.events && allEvents.events.length > 0}
          <div class="space-y-2">
            {#each allEvents.events.slice(0, 5) as event}
              <div class="border p-3 rounded">
                <p><strong>ID:</strong> {event.id}</p>
                <p><strong>Name:</strong> {event.name}</p>
                <p><strong>User ID:</strong> {event.user_id}</p>
                <p><strong>Status:</strong> {event.status}</p>
                <p>
                  <strong>Created:</strong>
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-500">No events found in database</p>
        {/if}
      {:else}
        <p class="text-red-500">Error loading all events: {allEvents.error}</p>
      {/if}
    </div>

    <!-- User Events -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">User Events</h2>
      {#if sessionData.user_Id}
        {#if userEvents.success}
          <p class="mb-2">
            <strong>User Events Found:</strong>
            {userEvents.events?.length || 0}
          </p>
          {#if userEvents.events && userEvents.events.length > 0}
            <div class="space-y-2">
              {#each userEvents.events as event}
                <div class="border p-3 rounded">
                  <p><strong>ID:</strong> {event.id}</p>
                  <p><strong>Name:</strong> {event.name}</p>
                  <p><strong>User ID:</strong> {event.user_id}</p>
                  <p><strong>Status:</strong> {event.status}</p>
                  <p>
                    <strong>Created:</strong>
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-500">
              No events found for user {sessionData.user_Id}
            </p>
          {/if}
        {:else}
          <p class="text-red-500">
            Error loading user events: {userEvents.error}
          </p>
        {/if}
      {:else}
        <p class="text-gray-500">No user ID available</p>
      {/if}
    </div>

    <!-- Analysis -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Analysis</h2>
      {#if sessionData.user_Id && allEvents.success && allEvents.events}
        {@const userEventsInDB = allEvents.events.filter(
          (e) => e.user_id === sessionData.user_Id
        )}
        <p>
          <strong>Events in DB for this user:</strong>
          {userEventsInDB.length}
        </p>
        <p>
          <strong>Events returned by API:</strong>
          {userEvents?.events?.length || 0}
        </p>

        {#if userEventsInDB.length > 0 && (userEvents?.events?.length || 0) === 0}
          <div
            class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4"
          >
            <strong>Issue Found:</strong> There are {userEventsInDB.length} events
            in the database for user {sessionData.user_Id}, but the API is
            returning 0 events. This suggests a problem with the query or
            session handling.
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

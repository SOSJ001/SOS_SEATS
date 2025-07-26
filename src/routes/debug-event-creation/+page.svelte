<script>
  import { onMount } from "svelte";

  let debugData = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const response = await fetch("/debug-event-creation");
      if (response.ok) {
        debugData = await response.json();
      } else {
        error = "Failed to fetch debug data";
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Debug Event Creation</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-6xl">
  <h1 class="text-3xl font-bold mb-6">Debug Event Creation</h1>

  {#if loading}
    <div class="text-center py-8">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
      ></div>
      <p class="mt-4">Loading debug data...</p>
    </div>
  {:else if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
    >
      <strong>Error:</strong>
      {error}
    </div>
  {:else if debugData}
    <div class="space-y-6">
      <!-- Session Data -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">Session Data</h2>
        <pre
          class="bg-white p-3 rounded text-sm overflow-x-auto">{JSON.stringify(
            debugData.sessionData,
            null,
            2
          )}</pre>
      </div>

      <!-- Analysis -->
      <div class="bg-green-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">Analysis</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-3 rounded">
            <div class="text-2xl font-bold text-blue-600">
              {debugData.analysis.totalEvents}
            </div>
            <div class="text-sm text-gray-600">Total Events</div>
          </div>
          <div class="bg-white p-3 rounded">
            <div class="text-2xl font-bold text-green-600">
              {debugData.analysis.userEventsCount}
            </div>
            <div class="text-sm text-gray-600">User Events</div>
          </div>
          <div class="bg-white p-3 rounded">
            <div class="text-2xl font-bold text-purple-600">
              {debugData.analysis.web3UsersCount}
            </div>
            <div class="text-sm text-gray-600">Web3 Users</div>
          </div>
          <div class="bg-white p-3 rounded">
            <div class="text-2xl font-bold text-orange-600">
              {debugData.analysis.hasWeb3UserRecord ? "Yes" : "No"}
            </div>
            <div class="text-sm text-gray-600">Has Web3 Record</div>
          </div>
        </div>
      </div>

      <!-- Web3 User Record -->
      {#if debugData.web3UserRecord}
        <div class="bg-purple-50 p-4 rounded-lg">
          <h2 class="text-xl font-semibold mb-3">Web3 User Record</h2>
          <pre
            class="bg-white p-3 rounded text-sm overflow-x-auto">{JSON.stringify(
              debugData.web3UserRecord,
              null,
              2
            )}</pre>
        </div>
      {/if}

      <!-- All Events -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">
          All Events in Database ({debugData.allEvents.length})
        </h2>
        {#if debugData.allEvents.length > 0}
          <div class="space-y-2">
            {#each debugData.allEvents as event}
              <div class="bg-white p-3 rounded border">
                <div class="flex justify-between items-start">
                  <div>
                    <strong>{event.name}</strong>
                    <div class="text-sm text-gray-600">ID: {event.id}</div>
                    <div class="text-sm text-gray-600">
                      User ID: {event.user_id}
                    </div>
                    <div class="text-sm text-gray-600">
                      Status: {event.status}
                    </div>
                    <div class="text-sm text-gray-600">Date: {event.date}</div>
                  </div>
                  <div class="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-600">No events found in database</p>
        {/if}
      </div>

      <!-- User Events -->
      <div class="bg-yellow-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">
          Events for Current User ({debugData.userEvents.length})
        </h2>
        {#if debugData.userEvents.length > 0}
          <div class="space-y-2">
            {#each debugData.userEvents as event}
              <div class="bg-white p-3 rounded border">
                <div class="flex justify-between items-start">
                  <div>
                    <strong>{event.name}</strong>
                    <div class="text-sm text-gray-600">ID: {event.id}</div>
                    <div class="text-sm text-gray-600">
                      Status: {event.status}
                    </div>
                    <div class="text-sm text-gray-600">Date: {event.date}</div>
                  </div>
                  <div class="text-xs text-gray-500">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-600">No events found for current user</p>
        {/if}
      </div>

      <!-- Web3 Users -->
      <div class="bg-indigo-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">
          Web3 Users ({debugData.web3Users.length})
        </h2>
        {#if debugData.web3Users.length > 0}
          <div class="space-y-2">
            {#each debugData.web3Users as user}
              <div class="bg-white p-3 rounded border">
                <div class="flex justify-between items-start">
                  <div>
                    <strong>{user.username || "No username"}</strong>
                    <div class="text-sm text-gray-600">ID: {user.id}</div>
                    <div class="text-sm text-gray-600">
                      Wallet: {user.wallet_address}
                    </div>
                  </div>
                  <div class="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-600">No Web3 users found</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

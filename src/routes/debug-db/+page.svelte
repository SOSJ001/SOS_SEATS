<script>
  import { onMount } from "svelte";

  let dbData = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const response = await fetch("/debug-db");
      if (response.ok) {
        dbData = await response.json();
      } else {
        error = "Failed to fetch database data";
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Debug Database</title>
</svelte:head>

<div class="container mx-auto p-6 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">Database Debug</h1>

  {#if loading}
    <div class="text-center py-8">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
      ></div>
      <p class="mt-4">Loading database data...</p>
    </div>
  {:else if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
    >
      <strong>Error:</strong>
      {error}
    </div>
  {:else if dbData}
    <div class="space-y-6">
      <!-- Summary -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">Database Summary</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white p-3 rounded">
            <div class="text-2xl font-bold text-blue-600">
              {dbData.totalEvents}
            </div>
            <div class="text-sm text-gray-600">Total Events</div>
          </div>
          <div class="bg-white p-3 rounded">
            <div class="text-2xl font-bold text-green-600">
              {dbData.web3UsersCount}
            </div>
            <div class="text-sm text-gray-600">Web3 Users</div>
          </div>
        </div>
      </div>

      <!-- All Events -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">
          All Events in Database ({dbData.events.length})
        </h2>
        {#if dbData.events.length > 0}
          <div class="space-y-2">
            {#each dbData.events as event}
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

      <!-- Web3 Users -->
      <div class="bg-yellow-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">
          Web3 Users ({dbData.web3Users.length})
        </h2>
        {#if dbData.web3Users.length > 0}
          <div class="space-y-2">
            {#each dbData.web3Users as user}
              <div class="bg-white p-3 rounded border">
                <div class="flex justify-between items-start">
                  <div>
                    <strong>{user.username || "No username"}</strong>
                    <div class="text-sm text-gray-600">ID: {user.id}</div>
                    <div class="text-sm text-gray-600">
                      Wallet: {user.wallet_address}
                    </div>
                    <div class="text-sm text-gray-600">
                      Display Name: {user.display_name || "None"}
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
          <p class="text-gray-600">No web3 users found</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

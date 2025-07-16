<script>
  import { fade, fly } from "svelte/transition";

  export let userName = "User";
  export let walletBalance = "$1,234.56";

  let showNotifications = false;
  let notifications = [
    { id: 1, message: "New ticket sold for Summer Fest", time: "2 min ago" },
    { id: 2, message: "Guest checked in: Jane Doe", time: "1 hour ago" },
    { id: 3, message: "Event created: Winter Gala", time: "Yesterday" },
  ];
</script>

<div
  class="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between"
>
  <!-- Left side - can be used for breadcrumbs or page title -->
  <div class="flex items-center space-x-4">
    <h1 class="text-white text-xl font-semibold">Dashboard</h1>
  </div>

  <!-- Right side - wallet, notifications, profile -->
  <div class="flex items-center space-x-6">
    <!-- Wallet Balance -->
    <div class="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
      <svg
        class="w-5 h-5 text-teal-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
        />
      </svg>
      <span class="text-white font-medium">{walletBalance}</span>
    </div>

    <!-- Notifications -->
    <div class="relative">
      <button
        on:click={() => (showNotifications = !showNotifications)}
        class="relative p-2 text-gray-300 hover:text-white transition-colors duration-200"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
          />
        </svg>
        {#if notifications.length > 0}
          <span
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {notifications.length}
          </span>
        {/if}
      </button>

      {#if showNotifications}
        <div
          class="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
          transition:fly={{ y: -10, duration: 200 }}
        >
          <div class="p-4 border-b border-gray-700">
            <h3 class="text-white font-semibold">Notifications</h3>
          </div>
          <div class="max-h-64 overflow-y-auto">
            {#each notifications as notification}
              <div
                class="p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition-colors duration-200"
              >
                <p class="text-gray-300 text-sm">{notification.message}</p>
                <p class="text-gray-500 text-xs mt-1">{notification.time}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- User Profile -->
    <div class="flex items-center space-x-3">
      <div
        class="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center"
      >
        <span class="text-white font-semibold text-sm">
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div class="hidden md:block">
        <p class="text-white font-medium text-sm">Hi, {userName}</p>
      </div>
    </div>
  </div>
</div>

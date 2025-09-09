<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let guests: Array<{
    id: string;
    name: string;
    wallet_address: string;
    status: string; // Changed to string to handle all status types
    avatar: string;
    selected?: boolean;
  }> = [];

  export let selectedGuests: string[] = [];
  export let selectAll: boolean = false;

  function toggleSelectAll() {
    if (selectAll) {
      selectedGuests = [];
    } else {
      selectedGuests = guests.map((guest) => guest.id);
    }
    selectAll = !selectAll;
    dispatch("selectionChange", { selectedGuests, selectAll });
  }

  function toggleGuestSelection(guestId: string) {
    if (selectedGuests.includes(guestId)) {
      selectedGuests = selectedGuests.filter((id) => id !== guestId);
    } else {
      selectedGuests = [...selectedGuests, guestId];
    }
    selectAll = selectedGuests.length === guests.length;
    dispatch("selectionChange", { selectedGuests, selectAll });
  }

  function viewGuestDetails(guest: any) {
    dispatch("viewDetails", { guest });
  }

  function getCheckInStatus(guest: any) {
    // Handle different status formats according to schema
    const status = guest.status?.toLowerCase();
    switch (status) {
      case "checked-in":
        return "Checked In";
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return guest.status || "Pending";
    }
  }

  function getCheckInColor(guest: any) {
    const status = guest.status?.toLowerCase();
    switch (status) {
      case "checked-in":
        return "text-green-400";
      case "confirmed":
        return "text-blue-400";
      case "pending":
        return "text-yellow-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  }

  function getStatusBadgeColor(guest: any) {
    const status = guest.status?.toLowerCase();
    switch (status) {
      case "checked-in":
        return "bg-green-500";
      case "confirmed":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }
</script>

<div class="bg-gray-800 rounded-lg overflow-hidden">
  <!-- Desktop Table (hidden on mobile) -->
  <div class="hidden md:block">
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-700 bg-gray-900">
          <th class="text-left py-4 px-6">
            <input
              type="checkbox"
              bind:checked={selectAll}
              on:change={toggleSelectAll}
              class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
            />
          </th>
          <th class="text-left py-4 px-6 text-gray-400 font-medium">NAME</th>
          <th class="text-left py-4 px-6 text-gray-400 font-medium">WALLET</th>
          <th class="text-left py-4 px-6 text-gray-400 font-medium">STATUS</th>
          <th class="text-left py-4 px-6 text-gray-400 font-medium">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#each guests as guest}
          <tr
            class="border-b border-gray-700 hover:bg-gray-700 transition-colors duration-200"
          >
            <td class="py-4 px-6">
              <input
                type="checkbox"
                checked={selectedGuests.includes(guest.id)}
                on:change={() => toggleGuestSelection(guest.id)}
                class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
              />
            </td>
            <td class="py-4 px-6">
              <div class="flex items-center">
                <img
                  src={guest.avatar}
                  alt={guest.name}
                  class="w-10 h-10 rounded-full mr-3"
                />
                <span class="text-white font-medium">{guest.name}</span>
              </div>
            </td>
            <td class="py-4 px-6 text-gray-300">
              {#if guest.wallet_address}
                {guest.wallet_address}
              {:else}
                <span class="text-gray-500 italic">No Wallet</span>
              {/if}
            </td>
            <td class="py-4 px-6">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadgeColor(
                  guest
                )} text-white"
              >
                {getCheckInStatus(guest)}
              </span>
            </td>
            <td class="py-4 px-6">
              <button
                on:click={() => viewGuestDetails(guest)}
                class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm flex items-center gap-1"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Details
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Mobile Cards (visible only on mobile) -->
  <div class="md:hidden">
    <!-- Mobile Header with Select All -->
    <div
      class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 bg-gray-900"
    >
      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          bind:checked={selectAll}
          on:change={toggleSelectAll}
          class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
        />
        <span class="text-gray-400 font-medium text-sm sm:text-base"
          >Select All</span
        >
      </div>
      <span class="text-gray-400 text-xs sm:text-sm"
        >{guests.length} guests</span
      >
    </div>

    <!-- Mobile Guest Cards -->
    <div class="space-y-3 p-3 sm:p-4">
      {#each guests as guest}
        <div class="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
          <!-- Guest Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedGuests.includes(guest.id)}
                on:change={() => toggleGuestSelection(guest.id)}
                class="w-4 h-4 text-teal-400 bg-gray-600 border-gray-500 rounded focus:ring-teal-400 focus:ring-2"
              />
              <img
                src={guest.avatar}
                alt={guest.name}
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
              />
            </div>
            <span
              class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadgeColor(
                guest
              )} text-white"
            >
              {getCheckInStatus(guest)}
            </span>
          </div>

          <!-- Guest Info -->
          <div class="space-y-2 mb-3 sm:mb-4">
            <div>
              <span class="text-white font-medium text-base sm:text-lg"
                >{guest.name}</span
              >
            </div>
            <div class="flex items-center gap-2">
              <svg
                class="w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span class="text-gray-300 text-xs sm:text-sm truncate">
                {#if guest.wallet_address}
                  {guest.wallet_address}
                {:else}
                  <span class="text-gray-500 italic">No Wallet</span>
                {/if}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              on:click={() => viewGuestDetails(guest)}
              class="flex-1 px-2 sm:px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center gap-1"
            >
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Details
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

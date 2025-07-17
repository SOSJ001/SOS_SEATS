<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let guests: Array<{
    id: string;
    name: string;
    email: string;
    status: 'Checked In' | 'Pending' | 'VIP';
    avatar: string;
    selected?: boolean;
  }> = [];

  export let selectedGuests: string[] = [];
  export let selectAll: boolean = false;

  function toggleSelectAll() {
    if (selectAll) {
      selectedGuests = [];
    } else {
      selectedGuests = guests.map(guest => guest.id);
    }
    selectAll = !selectAll;
    dispatch('selectionChange', { selectedGuests, selectAll });
  }

  function toggleGuestSelection(guestId: string) {
    if (selectedGuests.includes(guestId)) {
      selectedGuests = selectedGuests.filter(id => id !== guestId);
    } else {
      selectedGuests = [...selectedGuests, guestId];
    }
    selectAll = selectedGuests.length === guests.length;
    dispatch('selectionChange', { selectedGuests, selectAll });
  }

  function checkInGuest(guestId: string) {
    dispatch('checkIn', { guestId });
  }

  function deleteGuest(guestId: string) {
    dispatch('delete', { guestId });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Checked In':
        return 'text-green-400';
      case 'VIP':
        return 'text-purple-400';
      default:
        return 'text-gray-300';
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
          <th class="text-left py-4 px-6 text-gray-400 font-medium">EMAIL</th>
          <th class="text-left py-4 px-6 text-gray-400 font-medium">STATUS</th>
          <th class="text-left py-4 px-6 text-gray-400 font-medium">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {#each guests as guest}
          <tr class="border-b border-gray-700 hover:bg-gray-700 transition-colors duration-200">
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
            <td class="py-4 px-6 text-gray-300">{guest.email}</td>
            <td class="py-4 px-6">
              <span class="{getStatusColor(guest.status)} font-medium">
                {guest.status}
              </span>
            </td>
            <td class="py-4 px-6">
              <div class="flex gap-2">
                <button
                  on:click={() => checkInGuest(guest.id)}
                  class="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Check In
                </button>
                <button
                  on:click={() => deleteGuest(guest.id)}
                  class="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Mobile Cards (visible only on mobile) -->
  <div class="md:hidden">
    <!-- Mobile Header with Select All -->
    <div class="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          bind:checked={selectAll}
          on:change={toggleSelectAll}
          class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
        />
        <span class="text-gray-400 font-medium">Select All</span>
      </div>
      <span class="text-gray-400 text-sm">{guests.length} guests</span>
    </div>

    <!-- Mobile Guest Cards -->
    <div class="space-y-3 p-4">
      {#each guests as guest}
        <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
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
                class="w-12 h-12 rounded-full"
              />
            </div>
            <span class="{getStatusColor(guest.status)} font-medium text-sm">
              {guest.status}
            </span>
          </div>

          <!-- Guest Info -->
          <div class="space-y-2 mb-4">
            <div>
              <span class="text-white font-medium text-lg">{guest.name}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span class="text-gray-300 text-sm">{guest.email}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              on:click={() => checkInGuest(guest.id)}
              class="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm flex items-center justify-center gap-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Check In
            </button>
            <button
              on:click={() => deleteGuest(guest.id)}
              class="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

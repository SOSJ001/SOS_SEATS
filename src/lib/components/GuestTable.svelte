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

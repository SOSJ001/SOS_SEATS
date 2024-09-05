<script>
  //@ts-nocheck
  import { removeGuest } from "$lib/supabase.js";
  import ActionButton from "$lib/components/ActionButton.svelte";
  import { Modal } from "flowbite-svelte";
  import { fade, fly } from "svelte/transition";
  export let data;
  // modals open below
  let share = false;
  let rows = data.loadGuestsData.data; //getting the rows
</script>

<div class="px-3 md:px-0 w-full">
  <div class="overflow-auto shadow-md rounded-lg">
    <table class="w-full text-sm text-left text-gray-400">
      <thead class="text-xs uppercase bg-slate-600 text-white">
        <tr>
          <th scope="col" class="px-6 py-3"> # </th>
          <th scope="col" class="whitespace-nowrap px-6 py-3"> Guest Name </th>
          <th scope="col" class="px-6 py-3 whitespace-nowrap"> Event Name </th>
          <th scope="col" class="px-6 py-3 whitespace-nowrap"> Verified </th>
          <th scope="col" class="px-6 py-3"> Action </th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row, i (row.guest_id)}
          <tr
            class=" items-center border-b border-white bg-gray-800 hover:bg-gray-900"
          >
            <td class="px-6 py-4"> {i + 1} </td>
            <th
              scope="row"
              class="px-6 py-4 font-medium whitespace-nowrap text-white capitalize"
            >
              {row.guestName}
            </th>
            <td class="px-6 py-4"> {row.name} </td>
            <th class="px-6 py-4"> {row.verified}</th>
            <td class=" items-center px-6 py-4">
              <div class="flex gap-3 items-center">
                <button
                  on:click={() => {alert('If you want to re-share \nThis will resend this invite')}}>
                  <ActionButton
                    textColor="gray-200"
                    hoverTextColor="white"
                    width="full"
                    bgColor="yellow-500"
                  >
                    <span slot="text">Share</span>
                  </ActionButton>
                </button>
                <button
                  on:click|preventDefault|stopPropagation={async () => {
                    let error = await removeGuest(row.guest_id);
                    //this this what i'm working on
                    if (error === null) {
                      const removedArray = rows.splice(i, 1);
                      rows = [...rows];
                      alert("Successfully Removed");
                    }
                  }}
                  ><ActionButton
                    textColor="gray-200"
                    hoverTextColor="white"
                    width="full"
                    bgColor="red-500"
                  >
                    <span slot="text">Remove</span>
                  </ActionButton>
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
</div>

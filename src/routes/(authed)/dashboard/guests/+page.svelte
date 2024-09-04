<script>
  //@ts-nocheck
  import { removeGuest } from "$lib/supabase.js";
  export let data;

  let rows = data.loadGuestsData;
  $:rows.error !== null ? console.log(rows.error.message) : "";
</script>

<div class="relative overflow-auto shadow-md rounded-lg">
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
      {#await rows.data then rowData}
        {#if rowData !== null}
          {#each rowData as row, i}
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
                    on:click|preventDefault|stopPropagation={() => {
                      console.log("Download btn");
                    }}
                    class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >Download</button
                  >
                  <button
                    on:click|preventDefault|stopPropagation={async () => {
                      let error = await removeGuest(row.guest_id);
                      if (error === null) {
                        alert("Successfully Removed");
                      }
                    }}
                    class="font-medium text-red-600 dark:text-red-500 hover:underline"
                    >Remove</button
                  >
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      {/await}
    </tbody>
  </table>
</div>

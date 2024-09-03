<div class="relative overflow-auto shadow-md rounded-lg">
  <table class="w-full text-sm text-left text-gray-400">
    <thead class="text-xs uppercase bg-slate-600 text-white">
      <tr>
        <th scope="col" class="px-6 py-3"> # </th>
        <th scope="col" class="whitespace-nowrap px-6 py-3"> Guest Name </th>
        <th scope="col" class="px-6 py-3 whitespace-nowrap"> Status </th>
        <th scope="col" class="px-6 py-3 whitespace-nowrap"> Event Name </th>
        <th scope="col" class="px-6 py-3 whitespace-nowrap"> Shared On </th>
        <th scope="col" class="px-6 py-3"> Action </th>
      </tr>
    </thead>
    <tbody>
      <tr
        class=" items-center border-b border-white bg-gray-800 hover:bg-gray-900"
      >
        <td class="px-6 py-4"> 1 </td>
        <th
          scope="row"
          class="px-6 py-4 font-medium whitespace-nowrap text-white"
        >
          Apple MacBook Pro 17"
        </th>
        <td class="px-6 py-4"> Silver </td>
        <th class="px-6 py-4"> Laptop ggdvcjgsdvcgds</th>
        <td class="px-6 py-4 whitespace-nowrap"> Nle. 50 </td>

        <td class=" items-center px-6 py-4">
          <div class="flex gap-3 items-center">
            <a
              on:click|preventDefault|stopPropagation={() => {
                console.log("Download btn");
              }}
              href="#"
              class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >Download</a
            >
            <a
              on:click|preventDefault|stopPropagation={() => {
                console.log("Remove btn");
              }}
              href="#"
              class="font-medium text-red-600 dark:text-red-500 hover:underline"
              >Remove</a
            >
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

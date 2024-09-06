<script>
  //@ts-nocheck
  import { Card } from "flowbite-svelte";
  import Spinner from "$lib/components/Spinner.svelte";
  let userName;
  let amount;
  let disabled = false;
  let loading = false;
  let transferOptions;
  let data = [1, 1, 1, 1, 1,1,1,1,1,1,1,1,1,1];

  let sendToken = () => {
    alert("Transfer Clicked");
  };
</script>

<div class="flex flex-col h-full px-3 gap-4">
  <!-- Balance and Portfolio  -->
  <div
    class="md:flex md:flex-row md:gap-5 space-y-3 md:space-y-0 items-center justify-between md:h-28"
  >
    <!-- left col  -->
    <div class="w-full">
      <Card
        size="lg"
        class="bg-gray-800 md:h-28 h-24 flex flex-row items-center gap-5 p-5 rounded-lg border-none text-gray-200 w-full"
      >
        <h5 class="mb-2 text-2xl font-bold tracking-tight">Total Balance :</h5>
        <p class="font-normal leading-tight text-xl">240 USDC</p>
      </Card>
    </div>
    <!-- right col  -->
    <div class="w-full">
      <Card
        size="lg"
        class="bg-gray-800 md:h-28 p-5 rounded-lg border-none text-gray-200 w-full"
      >
        <h5 class="mb-2 text-2xl font-bold tracking-tight">Portfolio</h5>
        <div class="space-x-5">
          <span class="font-normal leading-tight">USDC 40</span>
          <span class="font-normal leading-tight">SOL 200</span>
        </div>
      </Card>
    </div>
  </div>
  <!-- transfer tokens -->
  <div class="font-bold text-xl border-b">Transfer</div>
  <div
    class="bg-gray-800 p-5 rounded-lg md:flex md:flex-row md:gap-5 space-y-5 md:space-y-0"
  >
    <select
      id="eventName"
      bind:value={transferOptions}
      class="w-full md:w-auto text-center border text-sm rounded-lg block p-2.5 bg-gray-700 border-gray-300 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
    >
      <option value={true} selected>S.O.S Seats User</option>
      <option value={false} selected>Enternal Solana Wallet</option>
    </select>
    <div
      class="md:flex md:flex-row justify-start md:gap-10 md:space-y-0 space-y-5"
    >
      <div class="md:flex md:flex-row gap-3 md:space-y-0 space-y-5">
        <input
          type="text"
          bind:value={userName}
          id="seatArea"
          class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500"
          placeholder="User Name"
          required
        />
        <input
          type="number"
          bind:value={amount}
          id="seatArea"
          class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500"
          placeholder="amount to transfer"
          required
        />
      </div>
      <button
        {disabled}
        on:click|preventDefault={sendToken}
        class="text-center md:w-auto w-full"
      >
        <div
          class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
        >
          {#if loading}
            <Spinner />
          {/if}

          <span>Send</span>
        </div>
      </button>
    </div>
  </div>
  <!-- history  -->
  <div class="font-bold text-xl border-b">History</div>
  <div class="shadow-md rounded-lg overflow-auto">
    <table class="w-full text-sm text-left text-gray-400">
      <thead class="text-xs uppercase bg-slate-600 text-white">
        <tr>
          <th scope="col" class="px-6 py-3">#</th>
          <th scope="col" class="whitespace-nowrap px-6 py-3"> Date </th>
          <th scope="col" class="px-6 py-3 whitespace-nowrap"> Mode </th>
          <th scope="col" class="px-6 py-3 whitespace-nowrap"> Receipient </th>
          <th scope="col" class="px-6 py-3 whitespace-nowrap"> Token </th>
          <th scope="col" class="px-6 py-3 whitespace-nowrap"> Amount </th>
        </tr>
      </thead>
      <tbody>
        {#each data as row, i}
          <tr
            class=" items-center border-b border-white bg-gray-800 hover:bg-gray-900"
          >
            <td class="px-6 py-4">{i + 1}</td>
            <td class="px-6 py-4">date</td>
            <td class="px-6 py-4">sth</td>
            <td class="px-6 py-4">sth</td>
            <td class="px-6 py-4">sth</td>
            <td class="px-6 py-4">sth</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

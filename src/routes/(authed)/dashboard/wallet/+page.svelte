<script>
  //@ts-nocheck
  import { Card } from "flowbite-svelte";
  import Spinner from "$lib/components/Spinner.svelte";
  import { invalidate } from "$app/navigation";
  import { ACTIONS_CORS_HEADERS } from "@solana/actions";
  export let data;
  const user_id = data.user_Id;
  let userName; //user name to send the transactions to
  let walletAddress; //wallet address to send the transaction to.
  let amount;
  let disabled = false; //to disable the buttons
  let loading = false;
  let transferOptions;
  let userNameArray = []; //to store the array of user name as popup when typing
  let data1 = [1, 1, 1, 1, 1, 1, 1, 1];

  let wallet = data.status; // to verify if the user has a wallet
  let createWalletLoader = false;
  let publickey = data.publickey;
  //send token function below
  let sendToken = async () => {
    loading = true;
    disabled = true;
    const response = await fetch("/transferSolApi", {
      method: "POST",
      body: JSON.stringify({ user_id, publickey, userName, amount }),
      headers: ACTIONS_CORS_HEADERS,
    });
    const { payload } = await response.json();
    invalidate("data:balance");
    if (payload) {
      alert(
        `Transaction Sig :\n https://solana.fm/tx/${payload}?cluster=devnet-solana`
      );
    } else {
      alert("User does not exists \n Try sending with external wallet option");
    }

    loading = false;
    disabled = false;
  };
  //create wallet
  let createWallet = async () => {
    disabled = true;
    createWalletLoader = true;
    const response = await fetch("/createWalletApi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { publicKey, status } = await response.json();
    disabled = false;
    createWalletLoader = false;
    publickey = publicKey;
    wallet = status;
  };

  //copy wallet address
  let copy = () => {
    // Prepare the clipboard data
    const clipboardData = window.clipboard;
    // Copy the text
    navigator.clipboard.writeText(publickey);
    alert("Publickey Copied");
  };
</script>

<div class="flex flex-col md:h-full h-fit px-3 gap-4">
  <!-- Balance and Portfolio  -->
  <div
    class="md:flex md:flex-row md:gap-5 space-y-3 md:space-y-0 items-center justify-between md:h-28"
  >
    <!-- left col  -->
    <!-- create wallet button and balance  -->
    <div class="w-full">
      <Card
        size="lg"
        class="bg-gray-800 md:h-28 h-24 flex flex-row items-center gap-5 p-5 rounded-lg border-none text-gray-200 w-full"
      >
        <h5 class="mb-2 text-2xl font-bold tracking-tight whitespace-nowrap">
          Total Balance :
        </h5>
        <!-- checking if there is a wallet for this user  -->
        {#if wallet}
          <p class="font-normal leading-tight text-xl">
            {data.balance.toFixed(4) || 0} SOL
          </p>
        {:else}
          <!-- if there is wallet -->

          <button
            {disabled}
            on:click={createWallet}
            class="text-center md:w-auto w-full"
          >
            <div
              class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
            >
              {#if createWalletLoader}
                <Spinner />
              {/if}

              <span>Create Wallet</span>
            </div>
          </button>
        {/if}
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
          {#if wallet}
            <span class="font-normal leading-tight">USDC 40</span>
            <span class="font-normal leading-tight">SOL 240</span>
          {:else}
            <span class="text-gray-500 font-normal leading-tight"
              >no data here</span
            >
          {/if}
        </div>
      </Card>
    </div>
  </div>
  <!-- transfer tokens and publicey-->
  <div class="font-bold text-xl border-b flex flex-row justify-between">
    <span>Transfer</span>

    {#if wallet}
      <div class="text-sm w-[200px] truncate text-end" title="click to copy">
        <label for="copy"><span>Publickey: </span>{publickey}</label>
        <button hidden id="copy" on:click={copy} {disabled}> copy </button>
      </div>
    {/if}
  </div>
  <div
    class="bg-gray-800 p-5 rounded-lg md:flex md:flex-row md:gap-5 space-y-5 md:space-y-0"
  >
    <select
      id="eventName"
      bind:value={transferOptions}
      class="w-full md:w-auto text-center text-sm rounded-lg block p-2.5 bg-gray-700 border-0 placeholder-gray-400 text-white focus:ring-0 focus:border-0"
    >
      <option value={true} selected>To S.O.S Seats User</option>
      <option value={false}>To Solana Wallet address </option>
    </select>
    <!-- transfer button here  -->
    <div
      class="md:flex md:flex-row justify-start md:gap-10 md:space-y-0 space-y-5"
    >
      <div class="md:flex md:flex-row gap-3 md:space-y-0 space-y-5">
        {#if transferOptions}
          <input
            type="text"
            bind:value={userName}
            list="userName"
            id="seatArea"
            class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500"
            placeholder="User Name"
            required
          />
        {:else}
          <input
            type="text"
            bind:value={walletAddress}
            id="seatArea"
            class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500"
            placeholder="paste wallet address"
            required
          />
        {/if}

        <input
          type="number"
          bind:value={amount}
          id="seatArea"
          class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500"
          placeholder="amount to transfer"
          required
        />
      </div>
      <!-- transfer button here  -->
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
        {#each data1 as row, i}
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

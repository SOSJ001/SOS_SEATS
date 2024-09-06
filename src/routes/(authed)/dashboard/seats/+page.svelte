<script>
  //@ts-nocheck
  import { placeSeatOrder } from "$lib/supabase.js";
  import Spinner from "$lib/components/Spinner.svelte";
  import { orderHistoryUpdates } from "$lib/supabase.js";
  orderHistoryUpdates
  let loading = false;
  let forSale = true;
  let ticketPrice;
  let event_Id;
  let disabled = false;
  let seatArea;
  let maxSeat;
  export let data;
  let events = data.events;
  let placeOrder = async () => {
    if (!seatArea || !event_Id || !maxSeat) {
      alert("Please Fill All Required Details");
      return;
    }
    disabled = true;
    loading = true;
    const { error, data } = await placeSeatOrder(
      event_Id,
      seatArea,
      maxSeat,
      ticketPrice
    );
    if (!error) {
      alert("Order Completed");
      // reset the values 
      event_Id = undefined
      seatArea = ''
      maxSeat = ''
      ticketPrice = ''
      disabled = false;
      loading = false;
      return;
    } else {
      console.log(error.message);
    }
  };
</script>

<div class="px-3  md:px-0 w-full overflow-hidden h-full">
  <div class="flex gap-4 overflow-hidden h-full">
    <div class="w-2/5 text-left bg-gray-800 p-5 rounded-lg">
      <h1 class="w-full text-center text-xl font-bold mb-3 underline">
        Create Order
      </h1>
      <!-- select an event and seat area  -->
      <div class=" grid gap-2">
        <div class="mb-3">
          <label
            for="eventName"
            class="block mb-2 text-sm font-medium text-white"
            >Select An Event *</label
          >
          <!-- select event here  -->
          <select
            id="eventName"
            bind:value={event_Id}
            class=" text-center border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-300 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={undefined} selected>Choose an event</option>
            {#each events as event}
              <option value={event.event_Id}>{event.eventName}</option>
            {/each}
          </select>
        </div>
        <!-- seat area here  -->
        <div class="mb-3">
          <label for="seatArea" class="block mb-2 text-sm font-medium"
            >Seat Area *</label
          >
          <input
            type="text"
            bind:value={seatArea}
            id="seatArea"
            class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="e.g VIP/Normal/First Class"
            required
          />
        </div>
      </div>
      <!-- number of seats and ticket price  -->
      <div class="grid md:grid-cols-2 gap-2">
        <!-- seats to order here  -->
        <div class="mb-3" title="number you want to order">
          <label for="maxSeat" class="block mb-2 text-sm font-medium text-white"
            >Number Of Seat to order *</label
          >
          <input
            bind:value={maxSeat}
            type="number"
            min="1"
            id="maxSeat"
            placeholder="Total Guests"
            class=" border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-300 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <!-- sales option here  -->
        <div class="flex flex-col gap-4 justify-start items-start">
          <!-- 1 col  -->
          <span class="text-sm font-medium">For sale</span>
          <!-- second col  -->
          <div class="flex flex-row gap-4">
            <!-- yes for sale  -->
            <div class="flex flex-row gap-2">
              <label for="ticketPrice" class="block mb-2 text-sm font-medium"
                >Yes</label
              >
              <input
                type="radio"
                id="ticketPrice"
                value={true}
                bind:group={forSale}
                min="0"
                class="bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 placeholder-gray-500"
                placeholder="Enter '0' if not for sale"
                required
              />
            </div>
            <!-- no Not for sale  -->
            <div class="flex flex-row gap-2">
              <label for="ticketPrice" class="block mb-2 text-sm font-medium"
                >No</label
              >
              <input
                type="radio"
                id="ticketPrice"
                value={false}
                bind:group={forSale}
                min="0"
                class="bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 placeholder-gray-500"
                placeholder="Enter '0' if not for sale"
                required
              />
            </div>
          </div>
        </div>
        <!-- for dale input  -->
        {#if forSale}
          <div class="mb-3 col-span-2">
            <label for="ticketPrice" class="block mb-2 text-sm font-medium"
              >Invite/Ticket Price</label
            >
            <input
              bind:value={ticketPrice}
              type="number"
              id="ticketPrice"
              min="0"
              class="text-white w-full bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 placeholder-gray-500"
              placeholder="Enter Price"
              required
            />
          </div>
        {/if}
      </div>

      <!-- Place seat button below -->
      <button
        {disabled}
        on:click|preventDefault={placeOrder}
        class="text-center w-full"
      >
        <div
          class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
        >
          {#if loading}
            <Spinner />
          {/if}

          <span>Place Order</span>
        </div>
      </button>
    </div>
    <!-- order history below  -->
    <div class="w-3/5 bg-gray-800 rounded-lg p-5 overflow-auto h-full">
      <h1 class="w-full text-center text-xl font-bold mb-3 underline">
        Order History
      </h1>
      {#if data.historyData === null}
        <div class="w-full h-4/5 justify-center items-center flex">
          <span class="text-gray-500">Oops! No data here</span>
        </div>
      {:else}

        <div class="shadow-md rounded-lg">
          <table class="w-full text-sm text-left text-gray-400">
            <thead class="text-xs uppercase bg-slate-600 text-white">
              <tr>
                <th scope="col" class="px-6 py-3">#</th>
                <th scope="col" class="whitespace-nowrap px-6 py-3"> Date </th>
                <th scope="col" class="px-6 py-3 whitespace-nowrap">
                  Event Name
                </th>
                <th scope="col" class="px-6 py-3 whitespace-nowrap">
                  Order Amount
                </th>
                <th scope="col" class="px-6 py-3 whitespace-nowrap">
                  Seat Area
                </th>
              </tr>
            </thead>
            <tbody>
              {#each data.historyData as data, i}
                <tr
                  class=" items-center border-b border-white bg-gray-800 hover:bg-gray-900">
                  <td class="px-6 py-4">{i+1}</td>
                  <td class="px-6 py-4">{`${new Date(data.order_date).getDay()}/${new Date(data.order_date).getMonth()}/${new Date(data.order_date).getFullYear()}`}</td>
                  <td class="px-6 py-4">{data.event_name}</td>
                  <td class="px-6 py-4">{data.order_amount} (Seats)</td>
                  <td class="px-6 py-4">{data.seat_area}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

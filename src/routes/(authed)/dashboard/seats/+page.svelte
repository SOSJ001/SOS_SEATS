<script>
  //@ts-nocheck
  let createEventBtn;
  let createEventBtnstyle;
  let show;
  let forSale = true;
  let ticketPrice;
  let event_Id;
  export let data;
  let events = data.events;
</script>

<div class="px-3 md:px-0 w-full overflow-hidden">
  <div class="grid grid-cols-12 gap-4 overflow-hidden">
    <form class="text-left col-span-6">
      <h1 class="w-full text-center text-xl font-bold mb-3 underline">
        Order Seats
      </h1>
      <!-- select an event and seat area  -->
      <div class=" grid gap-2">
        <div class="mb-3">
          <label
            for="eventName"
            class="block mb-2 text-sm font-medium text-white"
            >Select An Event</label
          >
          <select
            id="eventName"
            bind:value={event_Id}
            class=" text-center border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-300 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          >
            <option selected>Choose an event</option>
            {#each events as event}
              <option value={event.event_Id}>{event.eventName}</option>
            {/each}
          </select>
        </div>
        <div class="mb-3">
          <label for="seatArea" class="block mb-2 text-sm font-medium"
            >Seat Area</label
          >
          <input
            type="text"
            id="seatArea"
            class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="e.g VIP/Normal/First Class"
            required
          />
        </div>
      </div>
      <!-- number of seats and ticket price  -->
      <div class="grid md:grid-cols-2 gap-2">
        <!-- seats here  -->
        <div class="mb-3" title="number you want to order">
          <label for="maxSeat" class="block mb-2 text-sm font-medium text-white"
            >Number Of Seat</label
          >
          <input
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

      <!-- create event button below -->
      <button
        bind:this={createEventBtnstyle}
        on:click|preventDefault|once={() => {
          show = true;
          createEventBtn.innerText = "Adding Please Wait.....";
        }}
        class="text-center w-full"
        ><div
          class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
        >
          {#if show}
            <svg
              aria-hidden="true"
              role="status"
              class="inline w-4 h-4 mr-3 text-white animate-spin"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="#E5E7EB"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"
              />
            </svg>
          {/if}

          <span bind:this={createEventBtn}>Place Order</span>
        </div>
      </button>
    </form>
    <div class="col-span-6 border-2 rounded p-3 overflow-y-auto">
      <h1 class="w-full text-center text-xl font-bold mb-3 underline">
        Owned Seats
      </h1>
      <div class="w-full h-4/5 justify-center items-center flex">
        <span class="text-gray-500">Oops! No data here</span>
      </div>
    </div>
  </div>
</div>

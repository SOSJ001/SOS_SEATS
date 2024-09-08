<script>
  // @ts-nocheck
  import Sidebar from "$lib/components/sidebar.svelte";
  import Spinner from "$lib/components/Spinner.svelte";
  // @ts-nocheck

  import "animate.css";
  import Event from "$lib/components/event.svelte";
  import ActionButton from "$lib/components/ActionButton.svelte";
  import { Card, Button } from "flowbite-svelte";
  import nothing from "$lib/assets/nothing.png";
  import addEventPic from "$lib/assets/addEvent.png";
  import hi from "$lib/assets/hi.png";
  import { Modal } from "flowbite-svelte";
  import { goto } from "$app/navigation";
  import { fade, fly } from "svelte/transition";
  import TopnavDash from "$lib/components/TopnavDash.svelte";
  import DashboardUtilities from "$lib/components/DashboardUtilities.svelte";
  import DashboardEvent from "$lib/components/DashboardEvent.svelte";
  import { addEventFunction } from "$lib/supabase.js";
  import { sessionFromDb } from "$lib/store.js";
  import Waiting from "$lib/components/Waiting.svelte";
  import Qrscanner from "$lib/components/Qrscanner.svelte";
  export let data;
  $sessionFromDb = data.user_Id; //set the store user_id
  // ////////////////////////////////////////////////////////////////////////
  let EventTableResult = data.EventTableResult; //getting the event table result from the page.server.js load function
  // these are for the add event modal
  let eventName;
  let eventDate;
  let eventVenue;
  let Audience = "Private";
  let file_input; //this is the file that must be uploaded

  let Session1 = true;
  let event = false;
  let seat = false;
  let guest = false;
  let addEvent = false;
  let addSeat = false;
  let show = false;
  let scan = false;

  // /////////////////////////////////////////////
  let createEventFuncton = async () => {
    show = true;
    const {data, error} = await addEventFunction(
      eventName,
      eventDate,
      eventVenue,
      Audience,
      file_input,
      $sessionFromDb
    );
    if(!error){
      alert('Event Creaton Successful')
      console.log('invalidation here')
      show = false
      addEvent = false
    }else{
      alert('Cannot Create Event \n Try again')
    }
  };
</script>

<div class="flex flex-row">
  <!-- sidebar  -->
  <div class="">
    <Sidebar />
  </div>
  <div class="w-full overflow-hidden">
    <div
      class="w-full bg-gray-700 items-center text-white overflow-x-hidden h-screen md:px-5 overflow-hidden"
    >
      <!-- top  nav -->
      <TopnavDash >
        <svelte:fragment slot="userName">
          {data.userName}
        </svelte:fragment>
        
      </TopnavDash>
      <div class="flex flex-col overflow-hidden h-full w-full">
        <div class=" bg-gray-700 h-full w-full overflow-hidden">
          <div
            class=" pt-16 h-full bg-gray-700 overflow-y-auto pb-5 overflow-hidden w-full"
          >
            <DashboardUtilities>
              <button
                slot="addEvent"
                on:click={() => (addEvent = true)}
                class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
              >
                <div class="px-3 py-4 text-xl md:text-3xl">➕</div>
              </button>
              <!-- left column -->
              <svelte:fragment slot="button">
                <span
                  href="/dashboard"
                  class=" text-white text-sm text-center bg-gray-700 rounded"
                >
                  <div class="text-xl md:text-4xl p-3">🧾</div>
                </span>
              </svelte:fragment>
              <span slot="topLabel"> TOTAL </span>
              <span slot="buttomLabel"> EVENTS </span>
              <div slot="svg2" class=" text-2xl">
                <!-- DYBAMIC VALUE -->
                {#await EventTableResult}
                  <Waiting />
                {:then count}
                  <span>{count.length}</span>
                {/await}
              </div>

              <!-- right column -->
              <svelte:fragment slot="button2">
                <button
                  on:click={() => (seat = true)}
                  class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
                >
                  <div class="text-xl md:text-4xl p-3">🪑</div>
                </button>
              </svelte:fragment>

              <span slot="topLabel2"> TOTAL </span>
              <span slot="buttomLabel2"> SEATS </span>
              <span slot="svg4" class="text-2xl">
                <!-- DYBAMIC VALUE -->
                1000
              </span>

              <!-- list of event down here -->
            </DashboardUtilities>
            <div class="w-full h-2 mx-2 bg-yellow-400 mt-4 rounded-full mb-2" />
            <!-- This is the horizontal line yellow  -->

            <!-- if there is no event show this below  -->
            <!-- <div class=" hover:bg-slate-400 mx-2 rounded items-center">
          <img class="mx-auto my-auto" src={nothing} alt="nothing here" />
          <img
            class=" animate__animated animate__pulse animate__infinite animate__slow mx-auto my-auto"
            src={addEventPic}
            alt="nothing here"
          />
          <img
            class=" animate__animated animate__flash animate__slow 2s mx-auto animate__infinite w-25 h-20"
            src={hi}
            alt="nothing here"
          />
        </div> -->
            <!-- <DashboardEvent /> -->
            <slot />
          </div>
        </div>

        <!-- models down here  -->
        {#if event}
          <!-- Event modal below -->

          <div transition:fade>
            <Modal
              bodyClass="p-2"
              color="dark"
              title="LIST OF EVENTS"
              bind:open={event}
              size="lg"
              outsideclose
              class="bg-gray-700 text-white"
            ></Modal>
          </div>
        {/if}

        {#if seat}
          <!-- seat modal below -->
          <div transition:fade>
            <Modal
              bodyClass="p-2"
              color="dark"
              title="LIST OF SEATS"
              bind:open={seat}
              size="lg"
              outsideclose
              autoclose
              class="bg-gray-700 text-white"
            >
              <div class="relative overflow-x-auto shadow-md rounded-lg">
                <table class="w-full text-sm text-left text-gray-400">
                  <thead class="text-xs uppercase bg-slate-600 text-white">
                    <tr>
                      <th scope="col" class="px-6 py-3"> # </th>
                      <th scope="col" class="whitespace-nowrap px-6 py-3">
                        Event Name
                      </th>
                      <th scope="col" class="px-6 py-3 whitespace-nowrap">
                        Seat Area
                      </th>
                      <th scope="col" class="px-6 py-3 whitespace-nowrap">
                        Max Seat
                      </th>
                      <th scope="col" class="px-6 py-3"> Description </th>
                      <th scope="col" class="px-6 py-3"> Price </th>
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
                      <td class="px-6 py-4"> Hillstation </td>
                      <td class="px-6 py-4 whitespace-nowrap"> Nle. 50 </td>

                      <td class=" items-center px-6 py-4">
                        <div class="flex gap-3 items-center">
                          <button
                            on:click|preventDefault|stopPropagation={() => {
                              console.log("Edit btn");
                            }}
                            class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                            >Edit</button
                          >
                          <button
                            on:click|preventDefault|stopPropagation={() => {
                              console.log("Remove btn");
                            }}
                            class="font-medium text-red-600 dark:text-red-500 hover:underline"
                            >Remove</button
                          >
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                class=" font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
              >
                <span class="hidden md:block"
                  >Customer satisfaction is our GOAL!</span
                >
                <span class="md:hidden">Keep Smiling !</span>
                <button
                  on:click|preventDefault|stopPropagation={() => {
                    seat = false;
                    let time = setTimeout(() => {
                      addSeat = true;
                      clearTimeout(time);
                    }, 1000);
                  }}
                  class="text-white hover:text-gray-50 px-2 md:p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4z"
                    /></svg
                  >
                  <span class="">Add Seats</span>
                </button>
              </div>
            </Modal>
          </div>
        {/if}

        <!-- Add event modal below -->
        {#if addEvent}
          <div transition:fade>
            <Modal
              bodyClass="p-2"
              color="dark"
              title="CREATE EVENT"
              bind:open={addEvent}
              size="sm"
              outsideclose
              autoclose
              class="bg-gray-700 text-white"
            >
              <!-- create event foem -->
              <form class="text-left">
                <div class=" grid grid-cols-2 gap-2">
                  <div class="mb-3">
                    <label
                      for="eventName"
                      class="block mb-2 text-sm font-medium">Event Name</label
                    >
                    <input
                      bind:value={eventName}
                      type="text"
                      id="eventName"
                      class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Michael Johnson"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <label
                      for="eventDate"
                      class="block mb-2 text-sm font-medium">Event Date</label
                    >
                    <input
                      bind:value={eventDate}
                      type="date"
                      id="eventDate"
                      class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="SOSJ001"
                      required
                    />
                  </div>
                </div>
                <div class="mb-3">
                  <label for="eventVenue" class="block mb-2 text-sm font-medium"
                    >Event venue</label
                  >
                  <input
                    bind:value={eventVenue}
                    type="text"
                    id="eventVenue"
                    class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Hillstation"
                    required
                  />
                </div>
                <div class="mb-3">
                  <span class="mb-2 text-sm font-medium">Audience :</span>
                  <span class="text-yellow-400">
                    {#if Audience === "Private"}
                      <span in:fade>Only you can share</span>
                    {:else}
                      <span in:fade>Public for all and you can share too</span>
                    {/if}</span
                  >

                  <div
                    class=" flex bg-gray-50 text-black p-3 rounded-lg items-center gap-20 w-full justify-center"
                  >
                    <div class="flex items-center hover:text-yellow-400">
                      <input
                        bind:group={Audience}
                        id="default-radio-2"
                        type="radio"
                        value="Private"
                        name="audience"
                        class="w-4 h-4 text-yellow-400 focus:ring-yellow-400 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
                      />
                      <label
                        for="default-radio-2"
                        class="ml-2 text-sm font-medium">Private</label
                      >
                    </div>
                    <div class="flex items-center hover:text-yellow-400">
                      <input
                        bind:group={Audience}
                        id="default-radio-1"
                        type="radio"
                        value="Public"
                        name="audience"
                        class="w-4 h-4 text-yellow-400 focus:ring-yellow-400 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
                      />
                      <label
                        for="default-radio-1"
                        class="ml-2 text-sm font-medium">Public</label
                      >
                    </div>
                  </div>
                </div>

                <div class=" mb-3">
                  <label
                    class="block mb-2 text-sm font-medium text-white cursor-pointer hover:text-yellow-400"
                    for="file_input">Upload Flyer/Poster</label
                  >
                  <input
                    bind:this={file_input}
                    class="block w-full text-sm border rounded-lg cursor-pointer text-gray-700 focus:outline-none bg-gray-50 border-gray-50 placeholder-gray-400"
                    aria-describedby="file_input_help"
                    id="file_input"
                    type="file"
                    required
                  />
                  <!-- <p class="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">SVG, PNG, JPG or GIF (MAX. 800x400px).</p> -->
                </div>

                <!-- create event button below -->
                <button
                  on:click|preventDefault|once={createEventFuncton}
                  class="text-center w-full"
                  ><div
                    class="w-full flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
                  >
                    {#if show}
                      <Spinner />
                    {/if}

                    <span>Create Event</span>
                  </div>
                </button>
              </form>

              <!-- back button on the add event modal below -->
              <div
                class="  font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
              >
                <span class="hidden md:block"
                  >Customer satisfaction is our GOAL!</span
                >
                <span class="md:hidden">Keep Smiling !</span>
                <button
                  on:click|preventDefault|stopPropagation={() => {
                    addEvent = false;
                    let time = setTimeout(() => {
                      event = true;
                      clearTimeout(time);
                    }, 1000);
                  }}
                  class="text-white hover:text-gray-50 p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="24"
                    viewBox="0 0 32 32"
                    ><path
                      fill="currentColor"
                      d="m2.36 11.23l8.31 7.57c.61.56 1.6.12 1.6-.71v-3.63c0-.35.29-.64.64-.64h15.86c.66 0 1.19-.53 1.19-1.19V8.42c0-.66-.53-1.19-1.19-1.19H12.91c-.35 0-.64-.29-.64-.64V2.96c0-.83-.99-1.27-1.6-.71L2.36 9.82a.946.946 0 0 0 0 1.41Zm13.97 17.53l-2.54-6.95c-.16-.49-.62-.81-1.13-.81c-.51 0-.97.32-1.12.79l-2.57 6.98c-.18.48.07 1 .55 1.18c.1.03.21.05.32.05c.37 0 .73-.23.86-.6l.41-1.13c.04.01.08.01.12.01h2.87c.03 0 .07 0 .1-.01l.41 1.12c.18.48.7.73 1.18.55c.47-.17.71-.7.54-1.18Zm-4.54-2.32l.87-2.38l.86 2.38h-1.73Zm-3.56-2.73c0 .53-.15 1.02-.41 1.43a2.7 2.7 0 0 1 1.07 2.15c0 1.38-1.05 2.54-2.4 2.69c-.04.01-.09.02-.13.01c-.06.01-.12.01-.18.01H2.92a.92.92 0 0 1-.92-.93v-7.16c0-.5.41-.91.92-.91h2.6c.1 0 .19 0 .27.01a7.905 7.905 0 0 0 .19.03c1.28.22 2.25 1.34 2.25 2.67Zm-2.7-.87H3.84v1.74h1.68c.48 0 .88-.39.88-.87a.87.87 0 0 0-.87-.87Zm-1.69 3.57v1.74h2.35a.87.87 0 0 0 0-1.74H3.84Zm18.76 1.94a3.308 3.308 0 0 1-6.17-1.66v-2.38c0-1.83 1.48-3.31 3.31-3.31c1.18 0 2.28.64 2.87 1.65c.26.44.1 1-.33 1.26c-.44.26-1 .11-1.26-.33a1.5 1.5 0 0 0-1.28-.74c-.8 0-1.47.66-1.47 1.47v2.38c0 .81.67 1.47 1.47 1.47c.53 0 1.01-.28 1.28-.74c.26-.43.81-.59 1.26-.33c.42.26.58.82.32 1.26Zm4.63-3.48l2.6 3.68c.29.42.2.99-.23 1.29c-.42.29-.99.19-1.28-.22l-2.41-3.42l-.69.69v2.2c0 .51-.41.92-.92.92s-.92-.41-.92-.92v-7.17c0-.51.41-.92.92-.92s.92.41.92.92v2.37l3.01-3.02c.36-.36.94-.36 1.3 0c.36.36.36.94 0 1.3l-2.3 2.3Z"
                    /></svg
                  >
                </button>
              </div>
            </Modal>
          </div>
        {/if}
        <!-- Add seat modal below -->
        {#if addSeat}
          <div transition:fade>
            <Modal
              bodyClass="p-2"
              color="dark"
              title="ADD SEAT"
              bind:open={addSeat}
              size="sm"
              outsideclose
              autoclose
              class="bg-gray-700 text-white"
            >
              <!-- back button on the add Seat modal below -->
              <div
                class="  font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
              >
                <span class="hidden md:block"
                  >Customer satisfaction is our GOAL!</span
                >
                <span class="md:hidden">Keep Smiling !</span>
                <button
                  on:click|preventDefault|stopPropagation={() => {
                    addSeat = false;
                    let time = setTimeout(() => {
                      seat = true;
                      clearTimeout(time);
                    }, 1000);
                  }}
                  class="text-white hover:text-gray-50 p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="24"
                    viewBox="0 0 32 32"
                    ><path
                      fill="currentColor"
                      d="m2.36 11.23l8.31 7.57c.61.56 1.6.12 1.6-.71v-3.63c0-.35.29-.64.64-.64h15.86c.66 0 1.19-.53 1.19-1.19V8.42c0-.66-.53-1.19-1.19-1.19H12.91c-.35 0-.64-.29-.64-.64V2.96c0-.83-.99-1.27-1.6-.71L2.36 9.82a.946.946 0 0 0 0 1.41Zm13.97 17.53l-2.54-6.95c-.16-.49-.62-.81-1.13-.81c-.51 0-.97.32-1.12.79l-2.57 6.98c-.18.48.07 1 .55 1.18c.1.03.21.05.32.05c.37 0 .73-.23.86-.6l.41-1.13c.04.01.08.01.12.01h2.87c.03 0 .07 0 .1-.01l.41 1.12c.18.48.7.73 1.18.55c.47-.17.71-.7.54-1.18Zm-4.54-2.32l.87-2.38l.86 2.38h-1.73Zm-3.56-2.73c0 .53-.15 1.02-.41 1.43a2.7 2.7 0 0 1 1.07 2.15c0 1.38-1.05 2.54-2.4 2.69c-.04.01-.09.02-.13.01c-.06.01-.12.01-.18.01H2.92a.92.92 0 0 1-.92-.93v-7.16c0-.5.41-.91.92-.91h2.6c.1 0 .19 0 .27.01a7.905 7.905 0 0 0 .19.03c1.28.22 2.25 1.34 2.25 2.67Zm-2.7-.87H3.84v1.74h1.68c.48 0 .88-.39.88-.87a.87.87 0 0 0-.87-.87Zm-1.69 3.57v1.74h2.35a.87.87 0 0 0 0-1.74H3.84Zm18.76 1.94a3.308 3.308 0 0 1-6.17-1.66v-2.38c0-1.83 1.48-3.31 3.31-3.31c1.18 0 2.28.64 2.87 1.65c.26.44.1 1-.33 1.26c-.44.26-1 .11-1.26-.33a1.5 1.5 0 0 0-1.28-.74c-.8 0-1.47.66-1.47 1.47v2.38c0 .81.67 1.47 1.47 1.47c.53 0 1.01-.28 1.28-.74c.26-.43.81-.59 1.26-.33c.42.26.58.82.32 1.26Zm4.63-3.48l2.6 3.68c.29.42.2.99-.23 1.29c-.42.29-.99.19-1.28-.22l-2.41-3.42l-.69.69v2.2c0 .51-.41.92-.92.92s-.92-.41-.92-.92v-7.17c0-.51.41-.92.92-.92s.92.41.92.92v2.37l3.01-3.02c.36-.36.94-.36 1.3 0c.36.36.36.94 0 1.3l-2.3 2.3Z"
                    /></svg
                  >
                </button>
              </div>
            </Modal>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

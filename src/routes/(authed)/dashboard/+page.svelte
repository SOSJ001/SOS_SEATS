<script>
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
  import { sessionFromDb } from "$lib/variable";
  // import { Spinner } from "flowbite-svelte";
  import Waiting from "$lib/components/Waiting.svelte";
  import Qrscanner from "$lib/components/Qrscanner.svelte";
  export let data;

  // ////////////////////////////////////////////////////////////////////////
  let EventTableResult = data.EventTableResult; //getting the event table result from the page.server.js load function
  // these are for the modals
  let eventName;
  let eventDate;
  let eventVenue;
  let eventImage = "https://placehold.co/600x400";
  let Audience = "Private";
  export let file_input; //this is the file that must be uploaded
  let show = false;

  let createEventFuncton = () => {
    show = true;

    createEventBtn.innerText = "Creating Please Wait.....";

    addEventFunction(
      eventName.value,
      eventDate.value,
      eventVenue.value,
      Audience,
      file_input,
      $sessionFromDb
    );
    console.log(
      `Event Name = ${eventName.value}, Event Date = ${eventDate.value}, Event Venue = ${eventVenue.value}, Audience = ${Audience}, File_Input = ${file_input.value}.`
    );
  };

  // /////////////////////////////////////////////
  let createEventBtn;

  let createEventBtnstyle;
  // modals variable below
  let share = false;
  let scan = false;
  let shareBy; //radio button
  let guestName
</script>

<div class=" px-3 md:px-0 grid md:grid-cols-3 gap-5 overflow-y-auto">
  {#await EventTableResult}
    <Waiting />
  {:then rows}
    {#each rows as row, i (row.Event.id)}
      <Event
        eventName={row.Event.name}
        eventVenue={row.Event.venue}
        eventDate={row.Event.date}
        image={row.Image}
      >
        <div slot="button" class="grid grid-cols-3 gap-x-3">
          <button
            class="w-full"
            on:click={() => {
              // open the modal
              share = true;
              eventImage = row.Image;
              eventName = row.Event.name;
              eventVenue = row.Event.venue;
              eventDate = row.Event.date;
            }}
          >
            <ActionButton width="full" bgColor="yellow-500">
              <span slot="text">Share</span>
            </ActionButton>
          </button>
          <button class="w-full" on:click={() => (scan = true)}>
            <ActionButton width="full" bgColor="yellow-500">
              <span slot="text">Scan</span>
            </ActionButton>
          </button>

          <ActionButton bgColor="yellow-500">
            <span slot="text">Details</span>
          </ActionButton>
        </div>
      </Event>
    {/each}
  {:catch error}
    <p style="color: red">{error.message}</p>
  {/await}
  {#if scan}
    <!-- seat modal below -->
    <div transition:fade>
      <Modal
        bodyClass="p-2"
        color="dark"
        bind:open={scan}
        size="sm"
        class="bg-gray-700 text-white"
      >
        <h1>
          <!-- hi there <br /> (this is the scan modal) <br /> maintenance !! -->
        </h1>
        <Qrscanner />
      </Modal>
    </div>
  {/if}
  {#if share}
    <div transition:fade>
      <Modal
        bodyClass="p-2"
        color="dark"
        title="SHARE"
        bind:open={share}
        size="sm"
        outsideclose={true}
        autoclose
        class="bg-gray-700 text-white"
      >
        <div
          class="pt-5 flex flex-col items-center md:justify-between text-white rounded-lg shadow-xl bg-gray-800"
        >
          <!-- event image below -->
          <img src={eventImage} class="md:h-[200px] rounded-lg" alt="" />
          <!-- share details below -->
          <div class="w-full p-5">
            <div class="w-full flex-col items-start">
              <h5 class="mb-2 text-2xl font-bold tracking-tight">
                Share: {eventName}
              </h5>
              <div class="gap-3 flex flex-col items-start pb-5 w-full justify-between">
                  <input
                      bind:this={guestName}
                      type="text"
                      id="eventName"
                      class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Guest Name"
                      required
                    />
                <span class="text-md font-bold">How do you want to share : </span>
                <div class="flex justify-between items-start gap-10">
                  <!-- download qr -->
                  <span class="flex flex-col justify-center items-center">
                    <label for="download">QR</label>
                    <input
                      value="downloadQr"
                      bind:group={shareBy}
                      id="download"
                      type="radio"
                    />
                  </span>
                  <!-- download qr -->
                  <span class="flex flex-col justify-center items-center">
                    <label for="pass">Pass Code</label>
                    <input
                      value="passcode"
                      bind:group={shareBy}
                      id="pass"
                      type="radio"
                    />
                  </span>
                  <!--  -->
                  <span class="flex flex-col justify-center items-center">
                    <label for="mail">Email</label>
                    <input
                      value="email"
                      bind:group={shareBy}
                      id="mail"
                      type="radio"
                    />
                  </span>
                </div>
                <button class="w-full" on:click={()=>alert (guestName === undefined || guestName === ''?alert('enter Guest Name'):("succesfully downloaded"))}>
                  <ActionButton bgColor="yellow-500" width="full">
                  <span slot="text">Share</span>
                </ActionButton> 
                </button>
                               
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  {/if}
</div>

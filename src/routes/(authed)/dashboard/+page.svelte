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
  // these are for the add event modal
  let eventName;
  let eventDate;
  let eventVenue;
  let Audience = "Private";
  export let file_input; //this is the file that must be uploaded

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

  let Session1 = true;
  let event = false;
  let seat = false;
  let guest = false;
  let addEvent = false;
  let addSeat = false;
  let show = false;

  let createEventBtn;

  let createEventBtnstyle;

  let scan = false;
</script>

<div class="grid md:grid-cols-3 gap-5 overflow-y-auto">
  {#await EventTableResult}
    <Waiting />
  {:then rows}
    {#each rows as row, i}
      <Event
        eventName={row.Event.name}
        eventVenue={row.Event.venue}
        eventDate={row.Event.date}
        image={row.Image}
      >
        <div slot="button" class="grid grid-cols-3 gap-x-3">
          <ActionButton bgColor="yellow-500">
            <span slot="text">Share</span>
          </ActionButton>
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
</div>
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

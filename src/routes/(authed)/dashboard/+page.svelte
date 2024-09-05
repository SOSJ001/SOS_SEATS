<script>
  // @ts-nocheck
  import { sessionFromDb } from "$lib/store.js";
  import { invalidateAll } from "$app/navigation";
  import Event from "$lib/components/event.svelte";
  import { downloadImage, generateRandomChars } from "$lib/store.js";
  import { generateQrImage } from "$lib/store";
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
  import { addEventFunction, insertIntoGuestTable } from "$lib/supabase.js";
  import Waiting from "$lib/components/Waiting.svelte";
  import Qrscanner from "$lib/components/Qrscanner.svelte";
  export let data;
  if (data.cookievar1 !== undefined) {
    sessionFromDb.set(data.cookievar1);
  }
  let qrCode;
  let inviteCode;

  // ////////////////////////////////////////////////////////////////////////
  let EventTableResult = data.EventTableResult; //getting the event table result from the page.server.js load function
  // these are for the modals
  let eventName;
  let eventDate;
  let eventVenue;
  let eventId; //id if the event
  let eventImage = "https://placehold.co/600x400";
  let Audience = "Private";

  // modals variable below
  let share = false; //for share modal
  let scan = false; //for scan modal
  let shareBy; //radio button
  let emailField = false; //to show email field
  let passCodeDiv = false;
  let email;
  $: {
    // auto matic update of the variable to show the email field
    if (shareBy === "email") {
      emailField = true;
    } else {
      emailField = false;
    }
    if (shareBy === "downloadQr") {
      guestName = "";
      passCodeDiv = false;
    }
  }
  let guestName; //to get the name the guest
</script>

<div class=" px-3 md:px-0 grid lg:grid-cols-3 gap-5 overflow-y-auto">
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
        <!-- SHARE BUTTON, SCAN BUTTON AND DETAILS BUTTON BELOW  -->
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
              shareBy = "";
              passCodeDiv = false;
              eventId = row.Event.id;
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
        autoclose={false}
        class="bg-gray-700 text-white"
      >
        <div
          class="pt-5 flex flex-col items-center md:justify-between text-white rounded-lg shadow-xl bg-gray-800"
        >
          <!-- event image below -->
          {#if passCodeDiv}
            <div>CODE: {inviteCode}</div>
          {:else}
            <img
              bind:this={qrCode}
              src={eventImage}
              class="md:h-[200px] rounded-lg"
              alt=""
            />
          {/if}

          <!-- share details below -->
          <div class="w-full p-5">
            <div class="w-full flex-col items-start">
              <h5 class="mb-2 text-2xl font-bold tracking-tight">
                Share: {eventName}
              </h5>
              <div
                class="gap-3 flex flex-col items-start pb-5 w-full justify-between"
              >
                <input
                  bind:value={guestName}
                  type="text"
                  id="eventName"
                  class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Guest Name"
                  required
                />
                <span class="text-md font-bold"
                  >How do you want to share :
                </span>
                <!-- share by -->
                <div class="flex justify-between items-start gap-10">
                  <!-- download qr -->
                  <span class="flex flex-col justify-center items-center">
                    <label for="download">QR Code</label>
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
                  <!-- email -->
                  <span class="flex flex-col justify-center items-center">
                    <label for="mail">Email</label>
                    <input
                      value="email"
                      bind:group={shareBy}
                      id="mail"
                      type="radio"
                    />
                  </span>
                  <!-- sms -->
                  <span class="flex flex-col justify-center items-center">
                    <label for="sms">S.M.S</label>
                    <input
                      value="sms"
                      bind:group={shareBy}
                      id="sms"
                      type="radio"
                    />
                  </span>
                </div>
                <!-- email field below -->
                {#if emailField}
                  <input
                    bind:value={email}
                    type="text"
                    id="eventName"
                    class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                {/if}

                <button
                  class="w-full"
                  on:click={async () => {
                    if (shareBy === "downloadQr") {
                      // share by qr code
                      inviteCode = guestName + "_" + generateRandomChars();
                      eventImage = await generateQrImage(inviteCode);
                      downloadImage(eventImage, `${guestName}_invitatiion`);
                    } else if (shareBy === "passcode") {
                      // share by invite code
                      passCodeDiv = true;
                      inviteCode = guestName + "_" + generateRandomChars();
                    } else if (shareBy === "email"){
                      // share by email
                      alert(`Email sent to : ${email}`);
                    }
                    const response = await insertIntoGuestTable(
                      guestName,
                      inviteCode,
                      eventId
                    );
                    if (response.error === null) {
                      guestName = ""; //reset guest name
                      alert("Invitation Successfully Generated");
                      invalidateAll();
                    } else {
                      alert("Error Creating Invitation");
                    }
                  }}
                >
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

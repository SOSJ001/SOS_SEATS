<script>
  //@ts-nocheck
  import { onMount, onDestroy } from "svelte";
  import { Html5Qrcode } from "html5-qrcode";
  import ActionButton from "./ActionButton.svelte";
  import { scanGuestInvite, updateGuestInvite } from "$lib/supabase";
  import { fade } from "svelte/transition";
  import Spinner from "./Spinner.svelte";
  export let event_Id;
  let qrCodeScanner;
  let cameraId;
  let scanResult = "";
  let isScanning = false;
  let guestDetails = false;
  let guestName = "Michael S.O.S Johnson";
  let checkedIn = false;
  let gender = true;
  let disabled = true;
  let guestId = 0;
  let on = false;
  let loading = false;
  let InvalidInvite = false;
  let timeUsed = "";
  let updateSearchReasult = () => {
    let dialogResult = confirm(`Check-in ${guestName} ?`);
    loading = true;
    try {
      if (dialogResult) {
        updateGuestInvite(guestId).then((response) => {
          if (response.error) {
            console.log("here");
            alert("Error checking in !!!");
          } else {
            // console.log(response)
            // after status has been updated
            if (response.data[0].verified) {
              disabled = true;
              checkedIn = true;
            }
          }
        });
      }
    } catch (error) {
      alert(error.errorMessage);
    } finally {
      loading = false;
    }
  };

  let searchScanResult = () => {
    scanGuestInvite(scanResult, event_Id).then((response) => {
      loading = true;
      try {
        if (!response.error) {
          // if there is no error
          if (!response.data[0].verified) {
            // if the invite is not yet checked-in
            guestDetails = true;
            disabled = false;
            guestName = response.data[0].guestName;
            gender = response.data[0].IsMale;
            guestId = gender = response.data[0].id;
          } else {
            console.log(response);
            const date = new Date(response.data[0].verifiedTime);
            timeUsed = date.toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            checkedIn = false;
            InvalidInvite = true;
            guestDetails = true;
          }
        } else {
          alert("Error Connection");
        }
      } catch (error) {
        console.log(error.errorMessage);
      } finally {
        loading = false;
      }
    });
  };

  const startScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        cameraId = devices[0].id;
        on = !on;
        qrCodeScanner
          .start(
            { facingMode: "environment" }, // Use facingMode for better compatibility
            {
              fps: 10, // Optional, frames per second for the scanner
              qrbox: 350, // Optional, QR scanning box width
              disableFlip: true, // Important for iOS devices
            },
            (decodedText, decodedResult) => {
              // Handle the result
              scanResult = decodedText; //scan result
              isScanning = false;
              qrCodeScanner.stop();
              searchScanResult();
              // console.log(`Decoded Text: ${decodedText}`);
            },
            (errorMessage) => {
              // parse error, ignore it.
            }
          )
          .then(() => {
            isScanning = true;
          })
          .catch((err) => {
            console.error(`Unable to start scanning, error: ${err}`);
          });
      }
    } catch (err) {
      console.error(`Error getting cameras: ${err}`);
    }
  };

  const stopScanner = () => {
    if (on) {
      on = !on;
      qrCodeScanner
        .stop()
        .then(() => {
          isScanning = false;
        })
        .catch((err) => {
          console.error(`Error stopping scanner: ${err}`);
        });
    }
  };

  onMount(() => {
    qrCodeScanner = new Html5Qrcode("qr-reader");
  });

  onDestroy(() => {
    stopScanner();
  });
</script>

{#if guestDetails}
  <div transition:fade class="px-5 text-lg flex-wrap w-full">
    <div class="w-full text-center text-2xl border-b mb-2 pb-2">
      GUEST DETAILS
    </div>
    <p>
      <span class="text-gray-400">GuestName:</span>
      <span class="pl-2">{guestName}</span>
    </p>
    <p>
      <span class="text-gray-400">Gender:</span>
      <span class="pl-2">{gender ? "Male" : "Female"}</span>
    </p>
    <p>
      <span class="text-gray-400">Status:</span>
      {#if checkedIn}
        <span class="pl-2">Checked-In ✅</span>
      {:else if InvalidInvite}
        <span class="pl-2 text-red-400">🚩 Invalid...Used at {timeUsed}</span>
      {:else}
        <span class="pl-2 text-yellow-300">Not Checked-In 👀</span>
      {/if}
    </p>
    <div class="flex border-t pt-3 flex-row gap-5 m-3">
      <!-- Check in button -->
      <button
        {disabled}
        class="w-full text-sm"
        on:click|stopPropagation={() => {
          loading = true;
          updateSearchReasult();
          loading = false;
        }}
      >
        <ActionButton width="full" bgColor="green-500">
          <span slot="text"
            >{#if loading}<Spinner />{/if} Check In Now</span
          >
        </ActionButton>
      </button>

      <!-- cancel check in button -->
      <button
        {disabled}
        class="w-full text-sm"
        on:click|stopPropagation={() => {
          disabled = false;
          guestDetails = false;
        }}
      >
        <ActionButton width="full" bgColor="red-500">
          <span slot="text">Check In Later</span>
        </ActionButton>
      </button>
    </div>
  </div>
{/if}
{#if !guestDetails}
  <div id="qr-reader"></div>
{/if}

{#if isScanning}
  <button class="w-full" on:click={stopScanner} disabled={!isScanning}>
    <ActionButton width="full" bgColor="yellow-500">
      <span slot="text">Stop Scanner</span>
    </ActionButton>
  </button>
{:else}
  <button
    class="w-full"
    on:click={() => {
      checkedIn = false;
      loading = true;
      guestDetails = false;
      startScanner();
      loading = false;
    }}
    disabled={isScanning}
  >
    <ActionButton width="full" bgColor="yellow-500">
      <span slot="text"
        >{#if loading}<Spinner />{/if} Start Scanner</span
      >
    </ActionButton>
  </button>
{/if}

<style>
  #qr-reader {
    width: 300px;
    height: 230px;
    border: 1px solid #ccc;
    margin: 20px auto;
  }
</style>

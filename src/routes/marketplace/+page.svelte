<script>
  //@ts-nocheck
  import Event from "$lib/components/event.svelte";
  import { Button, Modal } from "flowbite-svelte";
  import ActionButton from "$lib/components/ActionButton.svelte";
  import Waiting from "$lib/components/Waiting.svelte";
  import { Tabs, TabItem } from "flowbite-svelte";

  export let data;
  let resale = data.marketplaceEvent.slice(1, 2);
  let paymentOptions = false;

  // for buying the event
  let eventImage;
  let eventName;
  let eventVenue;
  let eventDate;
  let shareBy;
  let passCodeDiv;
  let eventId;

  let array = [1, 1, 1, 1, 1];
  let counter = 0;
</script>

<div class="bg-gray-700 items-center text-white overflow-x-hidden">
  <div class="relative h-screen">
    <div class="w-full">
      <Tabs
        activeClasses="bg-none p-4 text-yellow-300"
        contentClass="bg-transparent pt-3 w-full"
      >
        <TabItem open title="Upcoming" class="">
          <div class="flex w-full">
            <div
              class="pt-3 px-5 grid sm:grid-cols-2 md:grid-cols-4 gap-3 w-full"
            >
              {#await data.marketplaceEvent}
                <Waiting />
              {:then rows}
                {#each rows as row, i (row.Event.id)}
                  <Event
                    eventName={row.Event.name}
                    eventVenue={row.Event.venue}
                    eventDate={row.Event.date}
                    image={row.Image}
                  >
                    <!-- Buy BUTTON, DETAILS BUTTON BELOW  -->
                    <div slot="button">
                      <span>Price: </span> <span>NLe 150</span>
                      <div class="grid grid-cols-2 gap-x-3">
                        <button
                          class="w-full"
                          on:click={() => (paymentOptions = true)}
                        >
                          <ActionButton width="full" bgColor="yellow-500">
                            <span slot="text">Buy Now</span>
                          </ActionButton>
                        </button>

                        <ActionButton bgColor="yellow-500">
                          <span slot="text">Details</span>
                        </ActionButton>
                      </div>
                    </div>
                  </Event>
                {/each}
              {:catch error}
                <p style="color: red">{error.message}</p>
              {/await}
            </div>
          </div>
        </TabItem>
        <TabItem title="Resales">
          <div class="flex w-full">
            <div
              class="pt-3 px-5 grid sm:grid-cols-2 md:grid-cols-4 gap-3 w-full"
            >
              {#await data.marketplaceEvent}
                <Waiting />
              {:then rows}
                {#each resale as row, i (row.Event.id)}
                  <Event
                    eventName={row.Event.name}
                    eventVenue={row.Event.venue}
                    eventDate={row.Event.date}
                    image={row.Image}
                  >
                    <!-- Buy BUTTON, DETAILS BUTTON BELOW  -->
                    <div slot="button">
                      <span>Price: </span> <span>NLe 150</span>
                      <div class="grid grid-cols-2 gap-x-3">
                        <button
                          class="w-full"
                          on:click={() => (paymentOptions = true)}
                        >
                          <ActionButton width="full" bgColor="yellow-500">
                            <span slot="text">Buy Now</span>
                          </ActionButton>
                        </button>

                        <ActionButton bgColor="yellow-500">
                          <span slot="text">Details</span>
                        </ActionButton>
                      </div>
                    </div>
                  </Event>
                {/each}
              {:catch error}
                <p style="color: red">{error.message}</p>
              {/await}
            </div>
          </div>
        </TabItem>
      </Tabs>
    </div>
  </div>
</div>

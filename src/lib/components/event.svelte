<script>
  import { Button } from "flowbite-svelte";
  export let eventName = "Event Name";
  export let eventVenue = "venue";
  export let eventDate = "date";
  export let image = "https://placehold.co/600x400";
</script>

<div
  class="pt-5 flex flex-col items-center md:justify-between text-white rounded-lg shadow-xl bg-gray-800"
>
  <!-- event image below -->
  <img
    src= {image}
    class="md:h-[200px] rounded-lg"
    alt=""
  />
  <!-- event details below -->
  <div class="w-full p-5">
    <div class="w-full flex-col items-start">
      <h5 class="mb-2 text-2xl font-bold tracking-tight">{eventName}</h5>
      <p class="mb-3 font-normal leading-tight">Venue: {eventVenue}</p>
      <p class="mb-3 font-normal leading-tight">Date: {eventDate}</p>
      <slot name="button">
        <Button>Edit</Button>
        <Button>Delete</Button>
      </slot>
    </div>
  </div>
</div>

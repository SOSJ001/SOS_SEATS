<script lang="ts">
  import { fade } from "svelte/transition";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: card = data.card;
  $: isSouvenir =
    card?.statusLabel === "digital_souvenir" || Boolean(card?.checkedIn);
</script>

<svelte:head>
  <title>Ticket | SOS SEATS</title>
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-6"
  in:fade={{ duration: 250 }}
>
  <div
    class="max-w-md w-full rounded-2xl border overflow-hidden shadow-2xl {isSouvenir
      ? 'border-cyan-500/50 shadow-cyan-500/20'
      : 'border-gray-600'}"
  >
    <div
      class="px-6 py-4 text-center text-sm font-semibold tracking-widest uppercase {isSouvenir
        ? 'bg-gradient-to-r from-cyan-600/40 to-purple-600/40 text-cyan-100'
        : 'bg-gray-800 text-gray-300'}"
    >
      {isSouvenir ? "Digital souvenir" : "Ticket"}
    </div>
    <div class="p-8 space-y-4 bg-gray-900/90">
      <h1 class="text-2xl font-bold text-center leading-tight">
        {String(card?.eventName ?? "Event")}
      </h1>
      <p class="text-center text-gray-400 text-sm">
        {card?.eventDate ? String(card.eventDate) : ""}
        {#if card?.eventLocation}
          <br />
          <span class="text-gray-500">{String(card.eventLocation)}</span>
        {/if}
      </p>
      <div class="text-center py-2">
        <span class="text-xs uppercase text-gray-500">Type</span>
        <p class="text-lg text-cyan-300">{String(card?.ticketType ?? "Ticket")}</p>
      </div>
      {#if isSouvenir}
        <p class="text-center text-sm text-gray-400">
          Attended — thanks for being part of the night.
        </p>
      {:else}
        <p class="text-center text-sm text-gray-400">
          Not checked in yet. Present this at the door.
        </p>
      {/if}
    </div>
  </div>
</div>

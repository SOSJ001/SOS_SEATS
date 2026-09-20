<script>
  // @ts-nocheck
  /** Entry QR overlay — desktop HI-FI 199:193 / mobile HI-FI 208:148. */
  import { onMount } from "svelte";
  import X from "lucide-svelte/icons/x";
  import {
    generateTicketPreview,
    defaultTicketDesignConfig,
    downloadImage,
    shareImageDataUrl,
  } from "$lib/store";

  /** @type {any} */
  export let event = null;
  /** @type {any} */
  export let guest = null;
  export let open = false;

  let previewUrl = "";
  let loading = false;

  $: if (open && guest && event) {
    loadPreview();
  }

  async function loadPreview() {
    loading = true;
    previewUrl = "";
    try {
      previewUrl = await generateTicketPreview({
        eventName: event.title || "Event",
        eventDate: event.rawDate || event.date,
        eventTime: event.time,
        eventLocation: event.location,
        eventImage: event.image,
        ticketTypeName: guest.ticketType || "Private Invite",
        ticketPrice: "0",
        guestName: guest.name || "Guest",
        ticketNumber: guest.ticketNumber || guest.id,
        qrData: guest.ticketNumber || guest.id || String(Date.now()),
        designConfig: event.ticketDesignConfig || defaultTicketDesignConfig,
      });
    } catch {
      previewUrl = "";
    } finally {
      loading = false;
    }
  }

  function close() {
    open = false;
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  onMount(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  export async function download() {
    if (!previewUrl) await loadPreview();
    if (previewUrl) {
      downloadImage(previewUrl, `ticket-${guest?.ticketNumber || guest?.id || "guest"}.png`);
    }
  }

  export async function share() {
    if (!previewUrl) await loadPreview();
    if (previewUrl) {
      await shareImageDataUrl({
        dataUrl: previewUrl,
        filename: `ticket-${guest?.ticketNumber || "guest"}.png`,
        title: event?.title || "Ticket",
        text: `Entry ticket for ${guest?.name || "guest"}`,
      });
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Entry QR"
  >
    <button
      type="button"
      class="absolute inset-0 cursor-pointer border-0 bg-transparent"
      aria-label="Close"
      on:click={close}
    ></button>
    <!-- Mobile 208:148: close above ticket; desktop 199:193: outside X -->
    <div
      class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col items-end gap-2 lg:items-center lg:gap-4"
    >
      <button
        type="button"
        class="flex size-7 shrink-0 items-center justify-center rounded-full border-0 bg-white text-ink shadow-lg cursor-pointer lg:absolute lg:-right-3 lg:-top-3 lg:size-10"
        aria-label="Close overlay"
        on:click={close}
      >
        <X size={16} class="lg:hidden" />
        <X size={20} class="hidden lg:block" />
      </button>
      {#if loading}
        <div
          class="flex h-80 w-full items-center justify-center rounded-2xl bg-paper text-sm text-ink-secondary"
        >
          Loading ticket…
        </div>
      {:else if previewUrl}
        <img
          src={previewUrl}
          alt="Entry ticket for {guest?.name || 'guest'}"
          class="max-h-[80vh] w-full rounded-2xl object-contain shadow-2xl"
        />
      {:else}
        <div
          class="flex h-80 w-full items-center justify-center rounded-2xl bg-paper text-sm text-ink-secondary"
        >
          Could not generate ticket preview.
        </div>
      {/if}
    </div>
  </div>
{/if}

<script>
  // @ts-nocheck
  /** My Tickets ticket reveal — desktop 607:1429 / mobile 83:25; card via TicketLivePreview 571:110. */
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import X from "lucide-svelte/icons/x";
  import TicketLivePreview from "$lib/components/organizer/TicketLivePreview.svelte";
  import {
    defaultTicketLayout,
    ensureTicketDesignWithLayout,
  } from "$lib/client/ticketLayout";
  import { exportTicketCardPng } from "$lib/client/exportTicketCard";
  import { defaultTicketDesignConfig, downloadImage } from "$lib/store";

  /** @type {any} */
  export let event = null;
  /** @type {any} */
  export let guest = null;
  export let open = false;

  $: eventName = event?.title || "Event";
  $: eventDate = event?.rawDate || "";
  $: eventTime = event?.time || "";
  $: eventLocation = event?.location || "";
  $: ticketTypes = [{ name: guest?.ticketType || "GA" }];
  $: ticketNumber = guest?.ticketNumber || guest?.id || "";
  $: qrData = guest?.ticketNumber || guest?.id || "";

  /** Honor organizer layout (left / right / centre) from ticket_design_config. */
  $: previewLayout = (() => {
    const design = ensureTicketDesignWithLayout(
      event?.ticketDesignConfig || defaultTicketDesignConfig
    );
    return {
      ...defaultTicketLayout,
      ...design.layout,
      includeVenue: design.layout?.includeVenue ?? true,
      includeDateTime: design.layout?.includeDateTime ?? true,
      showDisclaimer: design.layout?.showDisclaimer ?? true,
    };
  })();

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
    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      const dataUrl = await exportTicketCardPng({
        layout: previewLayout,
        eventName,
        eventDate,
        eventTime,
        eventLocation,
        ticketTypes,
        ticketNumber,
        qrData,
        scale: 1.5,
      });
      downloadImage(
        dataUrl,
        `ticket-${guest?.ticketNumber || guest?.id || "guest"}.png`
      );
    } catch {
      /* export failed; overlay still visible */
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Ticket reveal"
    transition:fade={{ duration: 180 }}
    data-node-id="607:1429"
  >
    <button
      type="button"
      class="absolute inset-0 cursor-pointer border-0 bg-transparent"
      aria-label="Close"
      on:click={close}
    ></button>

    <div
      class="relative z-10 flex w-full max-w-[358px] flex-col items-end gap-2 lg:w-[420px] lg:max-w-full lg:gap-3"
      transition:scale={{ duration: 200, start: 0.95 }}
      data-node-id="607:1430"
    >
      <button
        type="button"
        class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d9d9de] bg-[#f9fafb] text-[#12121a] lg:size-10 lg:rounded-xl"
        aria-label="Close overlay"
        on:click={close}
        data-node-id="607:1431"
      >
        <X size={14} strokeWidth={2.5} />
      </button>

      <div class="w-full shrink-0">
        <TicketLivePreview
          layout={previewLayout}
          {eventName}
          {eventDate}
          {eventTime}
          {eventLocation}
          {ticketTypes}
          {ticketNumber}
          {qrData}
        />
      </div>
    </div>
  </div>
{/if}

<script>
  // @ts-nocheck
  /** HI-FI live ticket preview (Centre 574:440; Left 571:112; Right mirror). */
  import MapPin from "lucide-svelte/icons/map-pin";
  import Calendar from "lucide-svelte/icons/calendar";
  import {
    FONT_FAMILY_CSS,
    formatTicketDate,
    ticketTypeBadge,
  } from "$lib/client/ticketLayout";

  export let layout = {};
  export let eventName = "";
  export let eventDate = "";
  export let eventTime = "";
  export let eventLocation = "";
  export let ticketTypes = [];
  /** Shown under Ticket No. Defaults to organizer wizard placeholder. */
  export let ticketNumber = "#SOS-2026-0042";

  $: branding =
    layout.brandingLabel?.trim() || eventName?.trim() || "Event name";
  $: badge = ticketTypeBadge(ticketTypes);
  $: dateLabel = formatTicketDate(eventDate, eventTime);
  $: fontCss = FONT_FAMILY_CSS[layout.fontFamily] || FONT_FAMILY_CSS.plusJakarta;
  $: accent = layout.accentColour || "#ff5a1f";
  $: isSide =
    layout.qrPlacement === "left" || layout.qrPlacement === "right";
  $: isRight = layout.qrPlacement === "right";
  $: ticketNoDisplay = ticketNumber?.startsWith("#")
    ? ticketNumber
    : `#${ticketNumber || "SOS-2026-0042"}`;

  const barcodeWidths = [
    2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1,
  ];
</script>

<div
  class="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-paper-border shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)]"
  style="font-family: {fontCss}; background: linear-gradient(to right, #1a1a2e, #16213e 50%, #0f3460);"
>
  {#if layout.backgroundPattern === "diagonal"}
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.08]"
      aria-hidden="true"
      style="background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 18px,
        rgba(255,255,255,0.9) 18px,
        rgba(255,255,255,0.9) 19px
      );"
    ></div>
  {:else if layout.backgroundPattern === "subtleGrid"}
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.08]"
      aria-hidden="true"
      style="background-image:
        linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px);
        background-size: 20px 20px;"
    ></div>
  {/if}

  <div
    class="relative h-1 w-full"
    style="background: linear-gradient(to right, {accent}, #ff8c42, {accent});"
  ></div>

  <div
    class="relative flex flex-col
      {isSide ? 'gap-3 px-5 py-4' : 'gap-4 px-6 pb-4 pt-5'}"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span
          class="h-[22px] w-[3px] shrink-0 rounded-sm"
          style="background-color: {accent}"
          aria-hidden="true"
        ></span>
        <span class="text-lg font-extrabold tracking-tight text-white">
          SOS SEATS
        </span>
      </div>
      <span
        class="rounded-xl px-2.5 py-1 text-[9px] font-bold uppercase tracking-[1px] text-white"
        style="background-color: {accent}"
      >
        {badge}
      </span>
    </div>

    {#if !isSide}
      <div class="h-px w-full border-t border-dashed border-white/25"></div>
    {/if}

    {#if isSide}
      <div
        class="flex w-full items-center gap-4
          {isRight ? 'flex-row-reverse' : ''}"
      >
        <div
          class="flex size-[72px] shrink-0 items-center justify-center rounded-lg border border-paper-border bg-white p-1.5"
        >
          <div class="relative size-[60px] overflow-hidden bg-white">
            <div class="absolute left-0 top-0 size-[18px] rounded-sm bg-[#181818]"></div>
            <div class="absolute left-1 top-1 size-2.5 bg-white"></div>
            <div class="absolute left-1.5 top-1.5 size-1.5 bg-[#181818]"></div>
            <div class="absolute right-0 top-0 size-[18px] rounded-sm bg-[#181818]"></div>
            <div class="absolute right-1 top-1 size-2.5 bg-white"></div>
            <div class="absolute right-1.5 top-1.5 size-1.5 bg-[#181818]"></div>
            <div class="absolute bottom-0 left-0 size-[18px] rounded-sm bg-[#181818]"></div>
            <div class="absolute bottom-1 left-1 size-2.5 bg-white"></div>
            <div class="absolute bottom-1.5 left-1.5 size-1.5 bg-[#181818]"></div>
            <div
              class="absolute inset-[22px] opacity-80"
              style="background-image: radial-gradient(#181818 1.5px, transparent 1.5px); background-size: 6px 6px;"
            ></div>
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p class="m-0 w-full text-[15px] font-extrabold leading-tight text-white">
            {branding}
          </p>
          {#if layout.includeVenue && eventLocation}
            <div class="flex items-center gap-1 text-[10px] text-[#9ca3a8]">
              <MapPin size={10} strokeWidth={2.5} color={accent} aria-hidden="true" />
              <span>{eventLocation}</span>
            </div>
          {/if}
          {#if layout.includeDateTime && dateLabel}
            <div class="flex items-center gap-1 text-[10px] text-[#9ca3a8]">
              <Calendar size={10} strokeWidth={2.5} color={accent} aria-hidden="true" />
              <span>{dateLabel}</span>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-3">
        <div class="flex w-full justify-center">
          <div
            class="flex size-[72px] items-center justify-center rounded-lg border border-paper-border bg-white p-1.5"
          >
            <div class="relative size-[60px] overflow-hidden bg-white">
              <div class="absolute left-0 top-0 size-[18px] rounded-sm bg-[#181818]"></div>
              <div class="absolute left-1 top-1 size-2.5 bg-white"></div>
              <div class="absolute left-1.5 top-1.5 size-1.5 bg-[#181818]"></div>
              <div class="absolute right-0 top-0 size-[18px] rounded-sm bg-[#181818]"></div>
              <div class="absolute right-1 top-1 size-2.5 bg-white"></div>
              <div class="absolute right-1.5 top-1.5 size-1.5 bg-[#181818]"></div>
              <div class="absolute bottom-0 left-0 size-[18px] rounded-sm bg-[#181818]"></div>
              <div class="absolute bottom-1 left-1 size-2.5 bg-white"></div>
              <div class="absolute bottom-1.5 left-1.5 size-1.5 bg-[#181818]"></div>
              <div
                class="absolute inset-[22px] opacity-80"
                style="background-image: radial-gradient(#181818 1.5px, transparent 1.5px); background-size: 6px 6px;"
              ></div>
            </div>
          </div>
        </div>

        <p class="m-0 w-full text-center text-xl font-extrabold leading-tight text-white">
          {branding}
        </p>

        {#if layout.includeVenue && eventLocation}
          <div class="flex items-center gap-1.5 text-[11px] text-white/90">
            <MapPin size={10} strokeWidth={2.5} color={accent} aria-hidden="true" />
            <span>{eventLocation}</span>
          </div>
        {/if}

        {#if layout.includeDateTime && dateLabel}
          <div class="flex items-center gap-1.5 text-[11px] text-white/90">
            <Calendar size={10} strokeWidth={2.5} color={accent} aria-hidden="true" />
            <span>{dateLabel}</span>
          </div>
        {/if}
      </div>
    {/if}

    <div class="h-px w-full border-t border-dashed border-white/25"></div>

    {#if layout.showDisclaimer}
      <p
        class="m-0 text-[8px] leading-tight text-white/50
          {isSide ? 'text-left' : 'text-center text-[9px]'}"
      >
        Please arrive 30 minutes early. Valid only for the date/time shown.
      </p>
    {/if}

    <div class="flex items-end justify-between gap-4 pt-1">
      <div class="flex h-7 items-end gap-px" aria-hidden="true">
        {#each barcodeWidths as w}
          <span class="block h-full bg-white" style="width: {w}px"></span>
        {/each}
      </div>
      <div class="text-right">
        <p class="m-0 text-[8px] uppercase tracking-wide text-white/50">Ticket No.</p>
        <p class="m-0 text-[11px] font-bold text-white">{ticketNoDisplay}</p>
      </div>
    </div>
  </div>
</div>

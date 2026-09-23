<script>
  // @ts-nocheck
  /**
   * Ticket list row — desktop 604:1548 / past 605:1402; mobile upcoming 610:1380 / past 611:1413 (308:76).
   */
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";

  export let ticket;
  /** @type {"upcoming" | "past"} */
  export let tab = "upcoming";
  /** @type {() => void} */
  export let onShowQr = () => {};
  /** @type {() => void} */
  export let onTransfer = () => {};
  /** @type {() => void} */
  export let onDownload = () => {};
  /** @type {() => void} */
  export let onViewDetails = () => {};

  $: status = ticket?.status || "VALID";
  $: isPast = tab === "past";
  $: showUpcomingActions = tab === "upcoming";
  $: isValid = status === "VALID";
  $: isCheckedIn = status === "CHECKED IN";
  $: isAttended = status === "ATTENDED";
  $: isExpired = status === "EXPIRED";

  $: statusClass = isPast
    ? isAttended
      ? "bg-accent-green-soft text-[#22c55e] lg:bg-brand/10 lg:text-brand"
      : "bg-[#f3f4f6] text-[#9ca3af]"
    : isValid
      ? "bg-accent-green-soft text-[#22c55e]"
      : isCheckedIn
        ? "bg-[#f5f3ff] text-[#8b5cf6]"
        : "bg-paper-cream text-ink-muted";

  $: priceClass = isPast
    ? isAttended
      ? "text-brand lg:text-ink-secondary"
      : "text-ink-secondary"
    : isValid && !ticket?.isFree
      ? "text-brand"
      : "text-ink-secondary";

  $: rowOpacity = isPast
    ? isExpired
      ? "lg:opacity-70"
      : "lg:opacity-85"
    : "";

  $: subtitle = isPast
    ? ticket?.eventLocation || ""
    : ticket?.rowMetaLine || "";

  $: calendarParts = (() => {
    if (!ticket?.eventDate) return { month: "", day: "", year: "" };
    const d = new Date(ticket.eventDate);
    if (Number.isNaN(d.getTime())) return { month: "", day: "", year: "" };
    return {
      month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: String(d.getDate()).padStart(2, "0"),
      year: String(d.getFullYear()),
    };
  })();

  $: dateTileMonthClass = isAttended ? "text-[#21b873]" : "text-[#999]";
</script>

<article
  class="flex w-full flex-col gap-3 rounded-2xl border border-paper-border bg-paper p-4 shadow-[0_6px_9px_rgba(0,0,0,0.05)] lg:flex-row lg:items-center lg:gap-4 lg:shadow-[0_4px_8px_rgba(0,0,0,0.03)] {rowOpacity}"
>
  <div class="flex min-w-0 flex-1 items-center gap-3" data-name="Card-Top">
    <div
      class="relative size-12 shrink-0 overflow-hidden rounded-xl lg:size-14"
    >
      {#if ticket.eventImage}
        <img
          src={ticket.eventImage}
          alt=""
          class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
          aria-hidden="true"
        />
        <img
          src={ticket.eventImage}
          alt=""
          class="absolute inset-0 size-full max-w-none object-contain"
        />
      {:else}
        <div class="size-full bg-paper-cream" aria-hidden="true"></div>
      {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3 lg:gap-2">
      <div class="flex flex-wrap items-center gap-3 lg:gap-2.5">
        <span
          class="inline-flex rounded-[30px] px-2.5 py-1 text-[11px] font-extrabold lg:py-0.5 {statusClass}"
        >
          {status}
        </span>
        <span class="text-[13px] font-bold {priceClass}">{ticket.priceLabel}</span>
      </div>
      <div class="flex flex-col gap-1 lg:gap-0.5">
        <h3 class="m-0 text-base font-extrabold text-ink lg:text-lg">
          {ticket.eventName}
        </h3>
        {#if showUpcomingActions || isPast}
          <div
            class="flex flex-wrap items-center gap-2 lg:hidden"
            data-name="meta-icons"
          >
            {#if ticket.dateLabel}
              <span class="flex items-center gap-1.5 text-ink-secondary">
                <Calendar size={10} strokeWidth={2.25} aria-hidden="true" />
                <span class="text-xs font-medium">{ticket.dateLabel}</span>
              </span>
            {/if}
            {#if ticket.eventLocation}
              <span class="flex items-center gap-1.5 text-ink-secondary">
                <MapPin size={10} strokeWidth={2.25} aria-hidden="true" />
                <span class="text-xs font-medium">{ticket.eventLocation}</span>
              </span>
            {/if}
          </div>
          {#if subtitle}
            <p class="m-0 hidden text-[13px] text-ink-secondary lg:block">
              {subtitle}
            </p>
          {/if}
        {/if}
      </div>
    </div>

    {#if isPast && calendarParts.month}
      <div
        class="flex h-[52px] w-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[10px] bg-[#f7f7f7] px-1 py-1.5 text-center lg:hidden"
        data-name="Date-Tile"
      >
        <p class="m-0 text-[10px] font-bold uppercase {dateTileMonthClass}">
          {calendarParts.month}
        </p>
        <p class="m-0 text-xl font-extrabold leading-none text-[#262626]">
          {calendarParts.day}
        </p>
      </div>
    {/if}
  </div>

  {#if isPast}
    <div class="flex w-full flex-col items-stretch lg:hidden">
      {#if isAttended}
        <button
          type="button"
          class="w-full cursor-pointer rounded-lg border-[1.5px] border-brand bg-transparent px-5 py-2.5 text-[13px] font-bold text-brand hover:bg-brand/5"
          on:click={onViewDetails}
        >
          View Receipt
        </button>
      {:else}
        <button
          type="button"
          disabled
          class="w-full cursor-not-allowed rounded-lg border border-paper-border bg-paper-cream px-5 py-2.5 text-[13px] font-bold text-ink-muted opacity-60"
        >
          QR Code Deactivated
        </button>
      {/if}
    </div>
    <div
      class="hidden w-full shrink-0 flex-col items-end gap-2 lg:flex lg:w-[100px]"
      data-node-id="606:1488"
    >
      {#if calendarParts.month}
        <div class="flex flex-col items-end gap-0.5">
          <p class="m-0 text-[10px] font-extrabold uppercase text-ink-secondary">
            {calendarParts.month}
          </p>
          <p class="m-0 text-2xl font-extrabold leading-none text-ink">
            {calendarParts.day}
          </p>
          <p class="m-0 text-[11px] font-medium text-ink-secondary">
            {calendarParts.year}
          </p>
        </div>
      {/if}
      <button
        type="button"
        class="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-brand underline hover:opacity-90"
        on:click={onViewDetails}
      >
        View Details
      </button>
    </div>
  {:else if showUpcomingActions}
    <div
      class="flex w-full shrink-0 flex-col items-stretch gap-2 lg:w-[200px] lg:items-end"
    >
      {#if isCheckedIn}
        <button
          type="button"
          disabled
          class="w-full cursor-not-allowed rounded-lg border border-paper-border bg-paper-cream px-5 py-2.5 text-[13px] font-bold text-ink-muted opacity-60 lg:px-3 lg:py-2"
        >
          QR Code Deactivated
        </button>
      {:else if isValid}
        <button
          type="button"
          class="w-full cursor-pointer rounded-lg border-[1.5px] border-brand bg-transparent px-5 py-2.5 text-[13px] font-bold text-brand hover:bg-brand/5 lg:px-3 lg:py-2"
          on:click={onShowQr}
        >
          Show entry QR
        </button>
        <div class="hidden gap-3 text-xs font-bold text-ink lg:flex">
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent p-0 underline hover:text-brand"
            on:click={onTransfer}
          >
            Transfer Ticket
          </button>
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent p-0 underline hover:text-brand"
            on:click={onDownload}
          >
            Download PDF
          </button>
        </div>
      {/if}
    </div>
  {/if}
</article>

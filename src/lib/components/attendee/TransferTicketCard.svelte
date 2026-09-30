<script>
  // @ts-nocheck
  /**
   * Transferable ticket: desktop selector card 604:1623 (dense per hifi-density),
   * mobile ticket card 624:1401. The Valid badge is static: the loader only returns VALID tickets.
   */
  import Check from "lucide-svelte/icons/check";
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";
  import AttendeeEventThumb from "./AttendeeEventThumb.svelte";

  export let ticket = null;
  /** @type {() => void} */
  export let onTransfer = () => {};

  $: dateVenue = [ticket?.dateLabel, ticket?.eventLocation].filter(Boolean).join(" · ");
</script>

{#if ticket}
  <article
    class="rounded-2xl border border-paper-border bg-paper p-4 shadow-[0_6px_9px_rgba(0,0,0,0.05)] lg:rounded-xl lg:shadow-[0_4px_8px_rgba(0,0,0,0.03)]"
  >
    <div class="flex flex-col gap-3 lg:hidden">
      <div class="flex items-center gap-3">
        <AttendeeEventThumb src={ticket.eventImage} sizeClass="size-12 rounded-xl" />
        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="rounded-[30px] bg-accent-green-soft px-2.5 py-1 text-[11px] font-extrabold text-[#22c55e]"
            >
              VALID
            </span>
            <span class="text-[13px] font-bold text-brand">{ticket.priceLabel}</span>
          </div>
          <div class="flex flex-col gap-1">
            <p class="m-0 text-base font-extrabold text-ink">{ticket.eventName}</p>
            <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-secondary">
              {#if ticket.dateLabel}
                <span class="flex items-center gap-1.5">
                  <Calendar size={10} class="text-brand" aria-hidden="true" />
                  {ticket.dateLabel}
                </span>
              {/if}
              {#if ticket.eventLocation}
                <span class="flex items-center gap-1.5">
                  <MapPin size={10} class="text-brand" aria-hidden="true" />
                  {ticket.eventLocation}
                </span>
              {/if}
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        class="w-full cursor-pointer rounded-lg border-2 border-solid border-brand bg-transparent px-5 py-2.5 text-[13px] font-bold text-brand hover:bg-brand/5"
        on:click={onTransfer}
      >
        Transfer
      </button>
    </div>

    <div class="hidden flex-col items-start gap-3 lg:flex">
      <div class="flex w-full items-center justify-between">
        <p class="m-0 text-[11px] font-extrabold text-brand">{ticket.tierLabel}</p>
        <Check size={14} class="text-[#22c55e]" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div class="flex w-full items-center gap-3">
        <AttendeeEventThumb src={ticket.eventImage} sizeClass="size-14 rounded-xl" />
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p class="m-0 text-[15px] font-extrabold text-ink">{ticket.eventName}</p>
          <p class="m-0 text-[13px] text-ink-secondary">{dateVenue}</p>
        </div>
      </div>
      <div class="flex w-full items-center justify-between">
        <span class="text-xs font-bold text-ink-secondary">Eligibility</span>
        <span class="rounded bg-[#f5f5f5] px-2 py-1 text-[11px] font-extrabold text-[#22c55e]">
          Valid
        </span>
      </div>
      <button
        type="button"
        class="cursor-pointer rounded-lg border border-solid border-brand bg-transparent px-3 py-2 text-[13px] font-bold text-brand hover:bg-brand/5"
        on:click={onTransfer}
      >
        Transfer
      </button>
    </div>
  </article>
{/if}

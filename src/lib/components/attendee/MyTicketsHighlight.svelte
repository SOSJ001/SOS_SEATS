<script>
  // @ts-nocheck
  /**
   * Highlight hero — upcoming 610:1332 / past 605:1361 + Hero-Left 1277:3341.
   * Dense desktop bias; mobile image-top full-bleed.
   */
  export let ticket = null;
  /** @type {"upcoming" | "past"} */
  export let variant = "upcoming";
  /** @type {() => void} */
  export let onShowQr = () => {};
  /** @type {() => void} */
  export let onAddToCalendar = () => {};
  /** @type {() => void} */
  export let onViewTicket = () => {};
  /** @type {() => void} */
  export let onFeedback = () => {};

  $: isPast = variant === "past";
  $: deactivated = !isPast && ticket?.status === "CHECKED IN";
</script>

{#if ticket}
  <section
    class="-mx-5 flex w-[calc(100%+2.5rem)] flex-col-reverse items-stretch gap-4 rounded-[20px] border border-paper-border bg-gradient-to-r from-[#fff7ed] to-[#fffbf5] p-5 shadow-[0_8px_12px_rgba(0,0,0,0.05)] md:-mx-20 md:w-[calc(100%+10rem)] lg:mx-0 lg:w-full lg:flex-row lg:items-center lg:gap-5 lg:p-4"
    data-node-id={isPast ? "605:1361" : "610:1332"}
  >
    <div
      class="flex min-w-0 flex-1 flex-col gap-3 lg:gap-3.5"
      data-node-id={isPast ? "1277:3341" : undefined}
    >
      {#if isPast && ticket.status}
        <span
          class="inline-flex w-fit rounded-[30px] px-3 py-1.5 text-[13px] font-extrabold {ticket.status ===
          'ATTENDED'
            ? 'bg-[#fff0ea] text-brand'
            : 'bg-[#f1f5f9] text-ink-secondary'}"
          data-node-id="1277:3342"
        >
          {ticket.status}
        </span>
      {:else if !isPast && ticket.countdownLabel}
        <span
          class="inline-flex w-fit rounded-[30px] bg-[#fff0ea] px-3 py-1.5 text-[13px] font-extrabold text-brand"
        >
          {ticket.countdownLabel}
        </span>
      {/if}

      <div class="flex flex-col gap-1.5">
        <p class="m-0 text-sm font-extrabold uppercase tracking-[1px] text-brand">
          {isPast ? "Past Highlight" : "Upcoming Highlight"}
        </p>
        <h2 class="m-0 text-[22px] font-extrabold leading-tight text-ink lg:text-2xl">
          {ticket.eventName}
        </h2>
        <p class="m-0 text-sm text-ink-secondary">
          {ticket.metaLine}
        </p>
      </div>

      <div
        class="flex w-full flex-col items-center gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:gap-3"
      >
        {#if isPast}
          <button
            type="button"
            class="hidden cursor-pointer rounded-lg border-[1.5px] border-brand bg-transparent px-3 py-2 text-[13px] font-bold text-brand hover:bg-brand/5 lg:inline-flex"
            on:click={onViewTicket}
          >
            View Ticket
          </button>
          <button
            type="button"
            class="w-full cursor-pointer border-0 bg-transparent p-0 text-center text-sm font-semibold text-brand underline hover:opacity-90 lg:w-auto lg:text-left lg:text-[13px] lg:text-ink-secondary lg:hover:text-brand"
            on:click={onFeedback}
          >
            <span class="lg:hidden">Leave a Review</span>
            <span class="hidden lg:inline">Feedback &amp; Review</span>
          </button>
        {:else if deactivated}
          <button
            type="button"
            disabled
            class="w-full cursor-not-allowed rounded-lg border border-paper-border bg-paper-cream px-6 py-3 text-sm font-bold text-ink-muted opacity-60 lg:w-auto lg:px-3 lg:py-2 lg:text-[13px]"
          >
            QR Code Deactivated
          </button>
          <button
            type="button"
            class="w-full cursor-pointer border-0 bg-transparent p-0 text-center text-sm font-semibold text-brand underline hover:opacity-90 lg:w-auto lg:text-left lg:text-[13px] lg:text-ink-secondary lg:hover:text-brand"
            on:click={onAddToCalendar}
          >
            Add to Calendar
          </button>
        {:else}
          <button
            type="button"
            class="w-full cursor-pointer rounded-lg border-0 bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90 lg:w-auto lg:px-3 lg:py-2 lg:text-[13px]"
            on:click={onShowQr}
          >
            Show Entry QR
          </button>
          <button
            type="button"
            class="w-full cursor-pointer border-0 bg-transparent p-0 text-center text-sm font-semibold text-brand underline hover:opacity-90 lg:w-auto lg:text-left lg:text-[13px] lg:text-ink-secondary lg:hover:text-brand"
            on:click={onAddToCalendar}
          >
            Add to Calendar
          </button>
        {/if}
      </div>
    </div>

    <div
      class="relative h-[231px] w-full shrink-0 overflow-hidden rounded-xl border border-paper-border lg:h-[160px] lg:w-[280px] lg:rounded-2xl"
      data-node-id={isPast ? "1265:3217" : "620:1333"}
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
        <div class="absolute inset-0 bg-slate-public" aria-hidden="true"></div>
      {/if}
    </div>
  </section>
{/if}

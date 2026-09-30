<script>
  // @ts-nocheck
  /**
   * Transfer receipt: "Transfer Successful" summary card desktop 527:385 (dense per hifi-density).
   * Ticket strip 658:1329, details 527:393, complete note 527:409, buttons 527:412.
   * failed: Transfer Failed card 680:1375, note 680:1420, buttons 680:1427, help line 527:620.
   * Mobile uses a white card (strip + details) with the rest outside it; `lg:contents` folds
   * everything back into the single desktop card.
   * Successful 311:265: card 680:1469, note 680:1517 and actions 680:1524 outside.
   * Failed 313:83: card 313:95 with divider 313:116 and note 680:1531 inside, actions 313:118
   * and support 313:127 outside.
   */
  import AttendeeEventThumb from "./AttendeeEventThumb.svelte";
  import AttendeeDateTile from "./AttendeeDateTile.svelte";
  import TransferResultNote from "./TransferResultNote.svelte";

  /**
   * @type {{
   *   eventName?: string, eventImage?: string | null, tierBadge?: string, ticketTypeName?: string,
   *   venue?: string, eventDateLabel?: string, dateMonth?: string, dateDay?: string,
   *   recipientUsername?: string, transferredAtLabel?: string, reference?: string,
   *   failureReason?: string, ticketId?: string
   * } | null}
   */
  export let receipt = null;
  /** @type {"success" | "failed"} */
  export let variant = "success";
  /** Failed variant: resets in place when set (same-URL links don't reset page state). */
  /** @type {(() => void) | null} */
  export let onTryAgain = null;

  $: failed = variant === "failed";

  $: rows = [
    { label: "Event", value: receipt?.eventName },
    { label: "Ticket Type", value: receipt?.ticketTypeName },
    { label: "Venue", value: receipt?.venue },
    { label: "Event date", value: receipt?.eventDateLabel },
    { label: "Username", value: receipt?.recipientUsername },
    { label: "Transfer Date", value: receipt?.transferredAtLabel },
    { label: "Reason", value: receipt?.failureReason, danger: true },
    { label: "Reference ID", value: receipt?.reference },
  ].filter((row) => row.value);

  $: tryAgainHref = receipt?.ticketId
    ? `/dashboard/my-tickets/transfers/${receipt.ticketId}`
    : "/dashboard/my-tickets/transfers";

  const buttonBaseClass =
    "flex w-full items-center justify-center no-underline lg:h-10 lg:text-[13px]";
  const primaryButtonClass = `${buttonBaseClass} h-[52px] rounded-xl bg-brand text-base font-bold text-white shadow-[0_8px_10px_rgba(255,90,31,0.15)] hover:opacity-90`;
  $: secondaryButtonClass = `${buttonBaseClass} ${failed
    ? "h-12 rounded-lg font-extrabold lg:rounded-xl lg:font-bold"
    : "h-[52px] rounded-xl font-bold"} border-2 border-solid border-brand bg-paper text-base text-brand hover:bg-brand/5`;
</script>

{#if receipt}
  <section
    class="flex w-full max-w-[640px] flex-col gap-6 lg:gap-3 lg:rounded-2xl lg:border lg:border-paper-border lg:bg-gradient-to-r lg:from-paper lg:to-brand-soft lg:p-4 lg:shadow-[0_8px_12px_rgba(18,4,28,0.04)]"
    aria-label={failed ? "Transfer details" : "Transfer receipt"}
  >
    <div
      class="flex flex-col gap-4 rounded-2xl border border-paper-border bg-paper p-5 shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:contents"
    >
      <div
        class="flex items-center gap-3 rounded-xl border border-paper-border bg-paper-cream p-3"
      >
        <AttendeeEventThumb
          src={receipt.eventImage}
          sizeClass="size-16 rounded-[10px] lg:size-14 lg:rounded-xl"
        />
        <div class="flex min-w-0 flex-1 flex-col items-start gap-1 lg:gap-1.5">
          {#if receipt.tierBadge}
            <span
              class="rounded-full bg-brand/[0.07] px-2.5 py-1 text-[10px] font-bold leading-[13px] text-brand lg:leading-normal"
            >
              {receipt.tierBadge}
            </span>
          {/if}
          <p class="m-0 break-words text-base font-extrabold leading-5 text-ink lg:text-lg">
            {receipt.eventName}
          </p>
        </div>
        {#if receipt.dateMonth && receipt.dateDay}
          <AttendeeDateTile
            variant="outlined"
            month={receipt.dateMonth}
            day={receipt.dateDay}
            monthClass="text-brand"
            sizeClass="h-[72px] w-14 rounded-[10px] lg:h-14 lg:w-12 lg:rounded-lg"
          />
        {/if}
      </div>

      {#if rows.length}
        <dl
          class="m-0 divide-y divide-paper-border overflow-hidden rounded-xl border border-paper-border bg-paper"
        >
          {#each rows as row (row.label)}
            <div
              class="flex items-center justify-between gap-4 px-4 py-3.5 text-[13px] leading-4 lg:px-3 lg:py-2.5 lg:leading-normal"
            >
              <dt class="shrink-0 text-ink-secondary">{row.label}</dt>
              <dd
                class="m-0 min-w-0 break-words text-right font-bold {row.danger
                  ? 'text-[#ef4444]'
                  : 'text-ink'}"
              >
                {row.value}
              </dd>
            </div>
          {/each}
        </dl>
      {/if}

      {#if failed}
        <hr class="m-0 h-px w-full border-0 bg-paper-border lg:hidden" />
        <TransferResultNote variant="failed" />
      {/if}
    </div>

    {#if !failed}
      <TransferResultNote variant="success" />
    {/if}

    <div class="flex w-full flex-col {failed ? 'gap-3.5 lg:gap-3' : 'gap-3'}">
      {#if failed}
        {#if onTryAgain}
          <button
            type="button"
            class="{primaryButtonClass} cursor-pointer border-0"
            on:click={onTryAgain}>Try Again</button
          >
        {:else}
          <a href={tryAgainHref} class={primaryButtonClass}>Try Again</a>
        {/if}
        <a href="/dashboard/my-tickets" class={secondaryButtonClass}>Back to My Tickets</a>
      {:else}
        <a href="/dashboard/my-tickets" class={primaryButtonClass}>Back to My Tickets</a>
        <a href="/marketplace" class={secondaryButtonClass}>Back to Browse</a>
      {/if}
    </div>
  </section>

  {#if failed}
    <p
      class="m-0 w-full max-w-[640px] pt-2 text-center text-xs leading-[1.4] text-ink-secondary lg:pt-0 lg:text-[13px] lg:leading-normal"
    >
      Need help? Contact
      <a
        href="mailto:support@sosseats.com"
        class="no-underline hover:underline lg:font-bold lg:text-brand">support@sosseats.com</a
      >
    </p>
  {/if}
{/if}

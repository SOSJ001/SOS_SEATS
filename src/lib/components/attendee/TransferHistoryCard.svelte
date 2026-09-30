<script>
  // @ts-nocheck
  /**
   * Transfer History card, mobile 627:1331 (311:174).
   * COMPLETED opens the receipt (FR-21e); PENDING shows a disabled "Transfer Pending" button.
   */
  import AttendeeEventThumb from "./AttendeeEventThumb.svelte";
  import AttendeeDateTile from "./AttendeeDateTile.svelte";
  import TransferStatusBadge from "./TransferStatusBadge.svelte";

  export let entry = null;
  /** @type {(entry: any) => void} */
  export let onViewReceipt = () => {};

  $: isPending = entry?.status === "PENDING";
</script>

{#if entry}
  <article class="flex w-full flex-col gap-3 rounded-2xl border border-paper-border bg-paper p-4">
    <div class="flex w-full items-center gap-3">
      <AttendeeEventThumb src={entry.eventImage} sizeClass="size-12 rounded-lg" />
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2.5">
          <TransferStatusBadge status={entry.status} size="sm" pill />
          {#if entry.tierLabel}
            <span class="text-xs font-bold text-brand">{entry.tierLabel}</span>
          {/if}
        </div>
        <h3 class="m-0 text-[15px] font-bold leading-tight text-ink">{entry.eventName}</h3>
        <p class="m-0 text-xs text-ink-secondary">Transferred on {entry.transferredAtLabel}</p>
      </div>
      {#if entry.dateMonth}
        <AttendeeDateTile month={entry.dateMonth} day={entry.dateDay} monthClass="text-[#21b873]" />
      {/if}
    </div>

    <div class="flex min-w-0 items-center gap-2">
      <span class="size-6 shrink-0 rounded-full bg-paper-border" aria-hidden="true"></span>
      <span class="truncate text-[13px] font-semibold text-ink">{entry.recipientUsername}</span>
    </div>

    {#if isPending}
      <button
        type="button"
        disabled
        class="flex h-9 w-full cursor-not-allowed items-center justify-center rounded-lg border-2 border-paper-border bg-paper-cream px-5 text-[13px] font-bold text-ink-secondary"
      >
        Transfer Pending
      </button>
    {:else}
      <button
        type="button"
        class="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-brand bg-paper px-5 text-[13px] font-bold text-brand hover:bg-brand/5"
        on:click={() => onViewReceipt(entry)}
      >
        View Receipt
      </button>
    {/if}
  </article>
{/if}

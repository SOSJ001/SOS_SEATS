<script>
  // @ts-nocheck
  /**
   * Transfer row. "recent": desktop 604:1644 (280/280/120 columns).
   * "full": Transfer History table 606:1386 (280/240/180/120 columns, adds tier).
   * No mobile frame for "recent"; below lg it stacks so it fits a 390px screen.
   * The whole row opens the receipt (FR-21e); PENDING rows are disabled until a receipt exists.
   * Inner elements are spans because a <button> may only contain phrasing content.
   */
  import AttendeeEventThumb from "./AttendeeEventThumb.svelte";
  import TransferStatusBadge from "./TransferStatusBadge.svelte";

  export let entry = null;
  export let last = false;
  /** @type {"recent" | "full"} */
  export let variant = "recent";
  /** @type {(entry: any) => void} */
  export let onViewReceipt = () => {};

  $: isFull = variant === "full";
  $: isPending = entry?.status === "PENDING";
  $: ariaLabel = isPending
    ? `${entry?.eventName}, transfer pending`
    : `View receipt for ${entry?.eventName}`;
</script>

{#if entry}
  <button
    type="button"
    disabled={isPending}
    aria-label={ariaLabel}
    class="flex w-full flex-col gap-3 p-4 text-left enabled:cursor-pointer enabled:hover:bg-paper-cream lg:flex-row lg:items-center lg:justify-between {last
      ? ''
      : 'border-b border-solid border-paper-border'}"
    on:click={() => onViewReceipt(entry)}
  >
    <span class="flex min-w-0 items-center gap-3 lg:w-[280px] lg:shrink-0">
      <AttendeeEventThumb src={entry.eventImage} sizeClass="size-12 rounded-lg" />
      <span class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="block truncate text-sm font-extrabold text-ink">{entry.eventName}</span>
        <span class="block text-xs text-ink-muted">Transferred on {entry.transferredAtLabel}</span>
      </span>
    </span>

    <span class="flex items-center justify-between gap-3 lg:contents">
      <span
        class="flex min-w-0 items-center gap-2 lg:shrink-0 {isFull ? 'lg:w-[240px]' : 'lg:w-[280px]'}"
      >
        <span class="size-6 shrink-0 rounded-full bg-paper-border" aria-hidden="true"></span>
        <span class="block truncate text-[13px] font-semibold text-ink">{entry.recipientUsername}</span>
      </span>
      {#if isFull}
        <span class="block truncate text-[13px] font-semibold text-ink-secondary lg:w-[180px] lg:shrink-0">
          {entry.tierLabel}
        </span>
      {/if}
      <span class="flex shrink-0 justify-end lg:w-[120px]">
        <TransferStatusBadge status={entry.status} size="xs" pill={isFull} />
      </span>
    </span>
  </button>
{/if}

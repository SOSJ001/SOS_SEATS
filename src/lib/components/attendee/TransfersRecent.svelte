<script>
  // @ts-nocheck
  /** Recent Transfers table (604:1641) with empty state. */
  import TransferHistoryRow from "./TransferHistoryRow.svelte";

  /** @type {any[]} */
  export let entries = [];
  export let title = "Recent Transfers";
  /** @type {(entry: any) => void} */
  export let onViewReceipt = () => {};
</script>

<section class="flex w-full flex-col gap-4 lg:gap-3" data-node-id="604:1641">
  <h2 class="m-0 text-lg font-extrabold text-ink">{title}</h2>
  {#if entries.length === 0}
    <p
      class="m-0 rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center text-sm text-ink-secondary"
    >
      No transfers yet.
    </p>
  {:else}
    <div class="w-full overflow-hidden rounded-xl border border-solid border-paper-border bg-paper">
      {#each entries as entry, i (entry.id)}
        <TransferHistoryRow
          {entry}
          variant="recent"
          {onViewReceipt}
          last={i === entries.length - 1}
        />
      {/each}
    </div>
  {/if}
</section>

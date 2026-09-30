<script>
  // @ts-nocheck
  /**
   * "All Transfers" section: desktop 606:1383 (Most Recent hero + table), mobile 626:1405 (cards).
   * The mobile Most Recent hero sits at the top of the page, so it is rendered by the layout.
   */
  import TransferLatestHero from "./TransferLatestHero.svelte";
  import TransferHistoryCard from "./TransferHistoryCard.svelte";
  import TransferHistoryRow from "./TransferHistoryRow.svelte";

  /** All transfers, newest first. @type {any[]} */
  export let entries = [];
  /** @type {(entry: any) => void} */
  export let onViewReceipt = () => {};

  $: latest = entries[0] ?? null;
</script>

<section class="flex w-full flex-col gap-4">
  <h2 class="m-0 text-base font-bold leading-5 text-ink lg:text-lg lg:font-extrabold lg:leading-7">
    All Transfers
  </h2>

  {#if entries.length === 0}
    <p
      class="m-0 rounded-2xl border border-dashed border-paper-border px-5 py-8 text-center text-sm text-ink-secondary"
    >
      No transfers yet.
    </p>
  {:else}
    {#if latest}
      <div class="hidden w-full lg:block">
        <TransferLatestHero entry={latest} {onViewReceipt} />
      </div>
    {/if}

    <div class="flex w-full flex-col gap-4 lg:hidden">
      {#each entries as entry (entry.id)}
        <TransferHistoryCard {entry} {onViewReceipt} />
      {/each}
    </div>

    <div
      class="hidden w-full overflow-hidden rounded-xl border border-solid border-paper-border bg-paper lg:block"
    >
      {#each entries as entry, i (entry.id)}
        <TransferHistoryRow
          {entry}
          variant="full"
          {onViewReceipt}
          last={i === entries.length - 1}
        />
      {/each}
    </div>
  {/if}
</section>

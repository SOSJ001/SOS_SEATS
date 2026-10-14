<script lang="ts">
  import WalletStatusPill from "./WalletStatusPill.svelte";
  import {
    formatWalletDateTime,
    rowAmount,
    rowAmountClass,
    rowStatusLabel,
    rowStatusTone,
    rowTitle,
    rowTypeLabel,
    type WalletHistoryRow,
  } from "$lib/client/walletFormat";

  export let rows: WalletHistoryRow[] = [];
</script>

<div class="flex w-full flex-col leading-normal">
  <div
    class="flex w-full items-start gap-5 border-b border-paper-border bg-paper-cream px-4 py-3 text-xs font-bold text-ink-secondary"
  >
    <p class="m-0 w-[150px] shrink-0">DATE &amp; TIME</p>
    <p class="m-0 min-w-0 flex-1">DESCRIPTION</p>
    <p class="m-0 w-[120px] shrink-0">TYPE</p>
    <p class="m-0 w-[130px] shrink-0">AMOUNT</p>
    <p class="m-0 w-[170px] shrink-0">STATUS</p>
  </div>
  {#each rows as row (row.kind + row.id)}
    <div class="flex w-full items-center gap-5 border-b border-paper-border px-4 py-3">
      <p class="m-0 w-[150px] shrink-0 text-[13px] text-ink-secondary">
        {formatWalletDateTime(row.createdAt)}
      </p>
      <p class="m-0 min-w-0 flex-1 break-words text-sm font-bold text-ink">
        {rowTitle(row, "desktop")}
      </p>
      <p class="m-0 w-[120px] shrink-0 text-[13px] text-ink-secondary">{rowTypeLabel(row)}</p>
      <p class="m-0 w-[130px] shrink-0 text-sm font-extrabold {rowAmountClass(row, 'desktop')}">
        {rowAmount(row)}
      </p>
      <div class="flex w-[170px] shrink-0 items-start">
        <WalletStatusPill label={rowStatusLabel(row)} tone={rowStatusTone(row)} />
      </div>
    </div>
  {/each}
</div>

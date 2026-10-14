<script lang="ts">
  import {
    formatWalletDate,
    rowAmount,
    rowAmountClass,
    rowStatusLabel,
    rowTitle,
    type WalletHistoryRow,
  } from "$lib/client/walletFormat";

  export let rows: WalletHistoryRow[] = [];
</script>

<div
  class="flex w-full flex-col overflow-hidden rounded-xl border border-paper-border bg-paper leading-normal"
>
  {#each rows as row (row.kind + row.id)}
    <div
      class="flex w-full items-center justify-between gap-3 border-b border-paper-border p-4 last:border-b-0"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <p class="m-0 break-words text-sm font-bold text-ink">{rowTitle(row, "mobile")}</p>
        <p class="m-0 text-xs text-ink-secondary">
          {formatWalletDate(row.createdAt)} · {rowStatusLabel(row)}
        </p>
      </div>
      <p class="m-0 shrink-0 whitespace-nowrap text-[15px] font-extrabold {rowAmountClass(row, 'mobile')}">
        {rowAmount(row)}
      </p>
    </div>
  {/each}
</div>

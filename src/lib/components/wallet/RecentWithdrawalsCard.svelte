<script lang="ts">
  import WalletStatusPill from "$lib/components/wallet/WalletStatusPill.svelte";
  import {
    formatNle,
    formatWalletDayTime,
    providerLabel,
    rowStatusLabel,
    rowStatusTone,
    type WalletHistoryRow,
  } from "$lib/client/walletFormat";

  export let rows: WalletHistoryRow[] = [];
  export let loading = false;

  $: withdrawals = rows.filter(
    (r): r is Extract<WalletHistoryRow, { kind: "withdrawal" }> => r.kind === "withdrawal"
  );
</script>

<section
  class="flex flex-col gap-3 rounded-2xl border border-solid border-paper-border bg-paper p-4"
  aria-labelledby="recent-withdrawals-title"
>
  <div class="flex items-center justify-between gap-3 leading-normal">
    <h2 id="recent-withdrawals-title" class="m-0 text-sm font-extrabold text-ink">
      Recent withdrawals
    </h2>
    <a href="/dashboard/wallet" class="text-[13px] font-bold text-brand no-underline hover:underline">
      View all
    </a>
  </div>

  {#if loading}
    <p class="m-0 py-4 text-center text-[13px] text-ink-secondary">Loading withdrawals...</p>
  {:else if withdrawals.length === 0}
    <p class="m-0 py-4 text-center text-[13px] text-ink-secondary">No withdrawals yet.</p>
  {:else}
    <ul class="m-0 flex list-none flex-col p-0">
      {#each withdrawals as row (row.id)}
        <li
          class="flex items-center justify-between gap-3 rounded-xl border border-solid border-paper-border bg-paper px-4 py-2.5"
        >
          <div class="flex min-w-0 flex-1 flex-col gap-0.5 leading-normal">
            <p class="m-0 truncate text-[13px] font-bold text-ink">{providerLabel(row.provider)}</p>
            <p class="m-0 truncate text-xs text-ink-secondary">{row.phoneMasked ?? "--"}</p>
          </div>
          <div class="flex w-40 shrink-0 flex-col items-end gap-0.5 leading-normal">
            <p
              class="m-0 whitespace-nowrap text-[13px] font-extrabold {row.status === 'failed'
                ? 'text-ink-secondary'
                : 'text-ink'}"
            >
              {formatNle(row.amount)}
            </p>
            <p class="m-0 whitespace-nowrap text-[11px] text-ink-secondary">
              {formatWalletDayTime(row.createdAt)}
            </p>
            <WalletStatusPill label={rowStatusLabel(row)} tone={rowStatusTone(row)} />
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

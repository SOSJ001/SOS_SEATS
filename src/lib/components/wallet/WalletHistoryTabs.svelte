<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { WalletHistoryFilter } from "$lib/client/walletFormat";

  export let filter: WalletHistoryFilter = "all";

  const dispatch = createEventDispatcher<{ change: WalletHistoryFilter }>();

  const tabs: { id: WalletHistoryFilter; label: string }[] = [
    { id: "all", label: "All History" },
    { id: "sales", label: "Ticket Sales" },
    { id: "withdrawals", label: "Withdrawals" },
  ];

  function select(id: WalletHistoryFilter) {
    if (id === filter) return;
    filter = id;
    dispatch("change", id);
  }
</script>

<div class="flex items-start gap-3 overflow-x-auto lg:gap-0" role="group" aria-label="Filter transactions">
  {#each tabs as tab}
    {@const active = tab.id === filter}
    <button
      type="button"
      class="shrink-0 cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-3 pb-1.5 pt-2 text-[13px] leading-normal lg:px-4 lg:pb-2 {active
        ? 'border-ink font-bold text-ink'
        : 'border-transparent font-medium text-ink-secondary hover:text-ink'}"
      aria-pressed={active}
      on:click={() => select(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

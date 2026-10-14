<script lang="ts">
  import { Inbox } from "lucide-svelte";
  import type { WalletHistoryFilter } from "$lib/client/walletFormat";

  export let filter: WalletHistoryFilter = "all";

  const subtitles: Record<WalletHistoryFilter, string> = {
    all: "Ticket sales and withdrawals will show here.",
    sales: "Ticket sales will show here.",
    withdrawals: "Withdrawals will show here.",
  };
</script>

<div
  class="flex flex-col items-center gap-1.5 rounded-xl border border-paper-border bg-paper px-4 py-8 text-center leading-normal lg:rounded-none lg:border-0 lg:py-16"
>
  <div class="flex size-12 items-center justify-center rounded-full bg-paper-cream">
    <Inbox size={24} class="text-ink-secondary" aria-hidden="true" />
  </div>
  <p class="m-0 text-[15px] font-bold text-ink">No transactions yet</p>
  <p class="m-0 text-[13px] text-ink-secondary">{subtitles[filter]}</p>
</div>

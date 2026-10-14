<script lang="ts">
  import type { WalletStatusTone } from "$lib/client/walletFormat";

  export let label: string;
  export let tone: WalletStatusTone = "green";

  const toneClass: Record<WalletStatusTone, string> = {
    green: "bg-accent-green-soft text-accent-green",
    red: "bg-[#fef2f2] text-[#ef4444]",
    amber: "bg-[#fef3c7] text-[#b45309]",
  };
</script>

<span
  class="inline-flex rounded px-2 py-0.5 text-[11px] font-bold leading-normal whitespace-nowrap {toneClass[tone]}"
>
  {label}
</span>

<script lang="ts">
  import { Info } from "lucide-svelte";
  import { formatPlatformFeePercent, formatWithdrawalMonimeFeePercent } from "$lib/fees";
</script>

<div
  class="flex items-center gap-2 rounded-xl border border-solid border-brand/15 bg-brand-faint p-3"
>
  <Info size={16} class="shrink-0 text-brand" aria-hidden="true" />
  <p class="m-0 min-w-0 flex-1 text-xs leading-[1.5] text-ink-secondary">
    Ticket sales show your money after our {formatPlatformFeePercent()} fee. When you withdraw, only
    a {formatWithdrawalMonimeFeePercent()} mobile money transfer fee is taken.
  </p>
</div>

<script lang="ts">
  import { Clock } from "lucide-svelte";
  import { formatNle } from "$lib/client/walletFormat";

  /** Amount of the withdrawal that is on its way or on hold */
  export let amount: number;
  /** No Monime payout id yet: we are still checking with the provider */
  export let onHold = false;
  let className = "";
  export { className as class };
</script>

<div
  class="flex items-center gap-2.5 rounded-xl bg-[#fef3c7] px-4 py-3 {className}"
  role="status"
>
  <Clock size={18} class="shrink-0 text-[#b45309]" aria-hidden="true" />
  <p class="m-0 min-w-0 flex-1 text-xs font-semibold leading-normal text-[#b45309] lg:text-[13px]">
    {#if onHold}
      A withdrawal of {formatNle(amount)} is on hold while we check with the mobile money provider.
      You can withdraw again once the check is finished.
    {:else}
      A withdrawal of {formatNle(amount)} is on its way. You can withdraw again once it finishes.
    {/if}
  </p>
</div>

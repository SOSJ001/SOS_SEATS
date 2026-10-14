<script lang="ts">
  import { formatNle } from "$lib/client/walletFormat";

  export let value = "";
  export let available: number | null = null;
  /** Replaces the helper line when set */
  export let error = "";
  export let disabled = false;
  export let id = "withdraw-amount";
</script>

<div class="flex flex-col gap-2">
  <label
    for={id}
    class="text-[13px] font-bold leading-normal text-slate-public lg:text-sm lg:font-semibold lg:text-ink"
  >
    <span class="lg:hidden">Withdrawal Amount (NLe)</span>
    <span class="hidden lg:inline">Amount to Withdraw (NLe)</span>
  </label>
  <input
    {id}
    type="text"
    inputmode="decimal"
    autocomplete="off"
    placeholder="e.g. 10,000"
    bind:value
    {disabled}
    aria-invalid={!!error}
    aria-describedby="{id}-help"
    class="h-12 w-full rounded-lg border bg-paper px-4 text-base font-bold text-slate-public placeholder:font-normal placeholder:text-[#999] focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 lg:h-10 lg:text-sm lg:font-normal lg:text-ink {error
      ? 'border-[#ef4444] focus:ring-[#ef4444]'
      : 'border-paper-border focus:border-brand focus:ring-brand lg:border-[#d9d9d9]'}"
  />
  {#if error}
    <p id="{id}-help" class="m-0 text-xs font-semibold leading-normal text-[#ef4444]" role="alert">
      {error}
    </p>
  {:else}
    <p id="{id}-help" class="m-0 text-xs leading-normal text-ink-secondary">
      Available to withdraw: {available === null ? "--" : formatNle(available)}
    </p>
  {/if}
</div>

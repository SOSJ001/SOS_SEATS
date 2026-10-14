<script lang="ts">
  import { WITHDRAW_PROVIDERS, type WithdrawProvider } from "$lib/client/walletFormat";
  import MmProviderLogo from "$lib/components/public/MmProviderLogo.svelte";

  export let provider: WithdrawProvider = "orange_money";
  export let disabled = false;
</script>

<div class="flex flex-col gap-2">
  <p
    id="withdraw-provider-label"
    class="m-0 text-[13px] font-bold leading-normal text-slate-public lg:text-ink-secondary"
  >
    <span class="lg:hidden">Select Mobile Money Provider</span>
    <span class="hidden lg:inline">SELECT PROVIDER</span>
  </p>
  <div class="flex gap-3" role="radiogroup" aria-labelledby="withdraw-provider-label">
    {#each WITHDRAW_PROVIDERS as p}
      {@const active = provider === p.id}
      <button
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={p.label}
        {disabled}
        class="flex min-w-0 flex-1 items-center justify-center rounded-xl border-solid p-3.5 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 lg:px-3 lg:py-2 {active
          ? 'border-[1.5px] border-brand bg-[#fff5f0] lg:border-2 lg:bg-[#fff7ed]'
          : 'border border-paper-border bg-white enabled:hover:border-ink-muted'}"
        on:click={() => (provider = p.id)}
      >
        <MmProviderLogo provider={p.id} class="h-6 lg:h-7" />
      </button>
    {/each}
  </div>
</div>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Clock } from "lucide-svelte";
  import { formatNle } from "$lib/client/walletFormat";

  /** null while loading or when the summary could not be loaded */
  export let available: number | null = null;
  export let pending: number | null = null;
  export let totalEarned: number | null = null;
  export let canWithdraw = false;
  /** Short line under the button, e.g. when all ticket money is still held */
  export let note: string | null = null;
  /** Amount of the withdrawal that is on its way, if any */
  export let inProgressAmount: number | null = null;

  const dispatch = createEventDispatcher<{ withdraw: void }>();

  const show = (n: number | null) => (n === null ? "--" : formatNle(n));
</script>

<div class="flex flex-col">
  <div
    class="flex flex-col gap-4 rounded-xl border border-paper-border bg-paper p-5 lg:rounded-2xl lg:p-6"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 flex-col gap-1 leading-normal">
        <p class="m-0 text-[13px] text-ink-secondary">Available Balance</p>
        <p class="m-0 font-display text-[32px] font-bold text-ink">{show(available)}</p>
      </div>
      <div class="hidden shrink-0 flex-col items-end gap-2 lg:flex">
        <button
          type="button"
          class="rounded-lg border-0 bg-brand px-6 py-3 text-sm font-bold text-white enabled:cursor-pointer enabled:hover:bg-[#e94e15] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canWithdraw}
          on:click={() => dispatch("withdraw")}
        >
          Withdraw to Mobile Money
        </button>
        {#if note}
          <p class="m-0 whitespace-nowrap text-xs text-ink-secondary">{note}</p>
        {/if}
      </div>
    </div>

    <div class="h-px w-full bg-paper-border"></div>

    <div class="flex items-start justify-between gap-4 leading-normal whitespace-nowrap lg:items-center">
      <div class="flex flex-col gap-0.5">
        <p class="m-0 text-[11px] text-ink-secondary">Pending Clearance</p>
        <p class="m-0 text-sm font-bold text-ink">{show(pending)}</p>
      </div>
      <div class="hidden h-8 w-px bg-paper-border lg:block"></div>
      <div class="flex flex-col items-end gap-0.5">
        <p class="m-0 text-[11px] text-ink-secondary">Total Earned</p>
        <p class="m-0 text-sm font-bold text-ink">{show(totalEarned)}</p>
      </div>
    </div>
  </div>

  {#if inProgressAmount !== null}
    <div
      class="mb-1 mt-3 flex items-center gap-2.5 rounded-xl bg-[#fef3c7] px-4 py-3 lg:mb-0 lg:mt-6"
      role="status"
    >
      <Clock size={18} class="shrink-0 text-[#b45309]" aria-hidden="true" />
      <p class="m-0 min-w-0 flex-1 text-xs font-semibold leading-normal text-[#b45309] lg:text-[13px]">
        A withdrawal of {formatNle(inProgressAmount)} is on its way. You can withdraw again once it
        finishes.
      </p>
    </div>
  {/if}

  <div class="flex flex-col gap-2.5 pt-4 lg:hidden">
    <button
      type="button"
      class="flex h-12 w-full items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white enabled:cursor-pointer enabled:hover:bg-[#e94e15] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={!canWithdraw}
      on:click={() => dispatch("withdraw")}
    >
      Withdraw to Mobile Money
    </button>
    {#if note}
      <p class="m-0 text-center text-xs text-ink-secondary">{note}</p>
    {/if}
  </div>
</div>

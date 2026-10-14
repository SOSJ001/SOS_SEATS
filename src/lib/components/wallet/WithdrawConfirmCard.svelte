<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { calculateWithdrawalFee, formatWithdrawalMonimeFeePercent } from "$lib/fees";
  import { displaySlPhone } from "$lib/slPhone";
  import { formatNle, providerLabel, type WithdrawProvider } from "$lib/client/walletFormat";

  export let amount: number;
  export let provider: WithdrawProvider;
  /** Normalised +232XXXXXXXX */
  export let phone: string;
  export let submitting = false;

  const dispatch = createEventDispatcher<{ confirm: void; back: void }>();

  $: fees = calculateWithdrawalFee(amount);
</script>

<div
  class="flex flex-col gap-4 lg:rounded-2xl lg:border lg:border-solid lg:border-paper-border lg:bg-paper lg:p-5"
>
  <div
    class="flex flex-col gap-3.5 rounded-2xl border border-solid border-paper-border bg-paper p-5 leading-normal lg:gap-3 lg:rounded-none lg:border-0 lg:p-0"
  >
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-sm">
      <p class="m-0 text-ink-secondary">Amount</p>
      <p class="m-0 shrink-0 whitespace-nowrap text-right font-bold text-ink">
        {formatNle(amount)}
      </p>
    </div>
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-sm">
      <p class="m-0 min-w-0 text-ink-secondary">
        Mobile money transfer fee ({formatWithdrawalMonimeFeePercent()})
      </p>
      <p class="m-0 shrink-0 whitespace-nowrap text-right font-bold text-[#ef4444]">
        -{formatNle(fees.monimeFee)}
      </p>
    </div>
    <div class="h-px w-full bg-paper-border"></div>
    <div class="flex items-center justify-between gap-3 text-ink">
      <p class="m-0 text-sm font-bold">You receive</p>
      <p class="m-0 shrink-0 whitespace-nowrap text-right text-lg font-extrabold">
        {formatNle(fees.netAmount)}
      </p>
    </div>
    <div class="h-px w-full bg-paper-border"></div>
    <div class="flex items-center justify-between gap-3 text-[13px] lg:text-sm">
      <p class="m-0 text-ink-secondary">To</p>
      <p class="m-0 min-w-0 text-right font-bold text-ink">
        {providerLabel(provider)} {displaySlPhone(phone)}
      </p>
    </div>
  </div>

  <button
    type="button"
    class="flex h-12 w-full items-center justify-center rounded-lg border-0 bg-brand text-[15px] font-bold text-white enabled:cursor-pointer enabled:hover:bg-[#e94e15] disabled:cursor-not-allowed disabled:opacity-40 lg:h-10 lg:rounded-xl lg:text-[13px]"
    disabled={submitting}
    on:click={() => dispatch("confirm")}
  >
    {submitting ? "Processing..." : "Confirm withdrawal"}
  </button>
  <button
    type="button"
    class="flex h-12 w-full items-center justify-center rounded-lg border border-solid border-paper-border bg-paper text-[15px] font-bold text-ink enabled:cursor-pointer enabled:hover:bg-paper-cream disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:rounded-xl lg:text-[13px]"
    disabled={submitting}
    on:click={() => dispatch("back")}
  >
    Go back
  </button>
</div>

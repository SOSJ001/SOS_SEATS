<script lang="ts">
  import { formatWithdrawalMonimeFeePercent } from "$lib/fees";
  import { displaySlPhone } from "$lib/slPhone";
  import { formatNle, providerLabel } from "$lib/client/walletFormat";

  export let gross: number;
  export let fee: number;
  export let net: number;
  export let provider: string;
  export let phone: string;

  $: rows = [
    { label: "Amount", value: formatNle(gross), valueClass: "font-bold text-ink" },
    {
      label: `Mobile money transfer fee (${formatWithdrawalMonimeFeePercent()})`,
      value: `-${formatNle(fee)}`,
      valueClass: "font-bold text-[#ef4444]",
    },
    { label: "You receive", value: formatNle(net), valueClass: "font-extrabold text-ink" },
    {
      label: "To",
      value: `${providerLabel(provider)} ${displaySlPhone(phone)}`,
      valueClass: "font-bold text-ink",
    },
  ];
</script>

<section
  class="flex flex-col gap-3 rounded-2xl border-[1.5px] border-solid border-paper-border bg-paper p-5 shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:p-4"
  aria-labelledby="withdraw-receipt-title"
>
  <h2 id="withdraw-receipt-title" class="m-0 text-base font-extrabold leading-normal text-ink">
    Withdrawal details
  </h2>
  {#each rows as row}
    <div class="h-px w-full bg-paper-border"></div>
    <div class="flex items-center justify-between gap-3 text-[13px] leading-normal">
      <p class="m-0 min-w-0 text-ink-secondary">{row.label}</p>
      <p class="m-0 shrink-0 text-right {row.valueClass}">{row.value}</p>
    </div>
  {/each}
</section>

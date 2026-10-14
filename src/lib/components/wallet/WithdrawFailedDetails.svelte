<script lang="ts">
  import { displaySlPhone } from "$lib/slPhone";
  import { formatNle, providerLabel } from "$lib/client/walletFormat";
  import WithdrawResultBanner from "./WithdrawResultBanner.svelte";

  export let gross: number;
  export let provider: string;
  export let phone: string;
  export let status = "Failed";
  export let statusClass = "text-[#ef4444]";
  export let noteTitle = "Nothing was sent";
  export let noteText = "You can try again now, with the same or a different number.";

  $: rows = [
    { label: "Amount", value: formatNle(gross), valueClass: "font-bold text-ink" },
    { label: "Provider", value: providerLabel(provider), valueClass: "font-bold text-ink" },
    { label: "Phone", value: displaySlPhone(phone), valueClass: "font-bold text-ink" },
    { label: "Status", value: status, valueClass: `font-bold ${statusClass}` },
  ];
</script>

<section
  class="flex flex-col gap-4 rounded-2xl border border-solid border-paper-border bg-paper p-5 shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:gap-3 lg:p-4"
  aria-label="Withdrawal details"
>
  <div
    class="flex flex-col divide-y divide-solid divide-paper-border rounded-xl border border-solid border-paper-border"
  >
    {#each rows as row}
      <div class="flex items-center justify-between gap-3 px-4 py-3.5 text-[13px] leading-normal lg:py-2.5">
        <p class="m-0 min-w-0 text-ink-secondary">{row.label}</p>
        <p class="m-0 shrink-0 text-right {row.valueClass}">{row.value}</p>
      </div>
    {/each}
  </div>
  <div class="h-px w-full bg-paper-border"></div>
  <WithdrawResultBanner tone="red" title={noteTitle} text={noteText} />
</section>

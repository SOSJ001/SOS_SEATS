<script>
  // @ts-nocheck
  /** Desktop checkout pending card — HI-FI 55:521 right panel. */
  import Loader from "lucide-svelte/icons/loader";
  import Copy from "lucide-svelte/icons/copy";
  import { showToast } from "$lib/store";

  export let ussdCode = "";
  export let transactionRef = "";
  export let carrier = "Orange Money";
  export let subtitle =
    "Complete the prompt on your phone. You can close this page - the order will be created automatically.";
  /** @type {string[]} */
  export let steps = [];
  /** @type {string[]} */
  export let tips = [
    "If the payment takes longer than 2 minutes, try the code again. Ensure your Orange Money account has sufficient balance.",
    "If payment fails, check your PIN and balance. You can retry or contact support.",
  ];

  async function copyUssd() {
    if (!ussdCode) return;
    try {
      await navigator.clipboard.writeText(ussdCode);
      showToast("success", "Copied!", "USSD code copied to clipboard");
    } catch {
      showToast("error", "Copy failed", "Could not copy the USSD code.");
    }
  }
</script>

<div
  class="relative z-10 flex w-full max-w-[440px] flex-col items-center gap-3 rounded-xl border border-paper-border bg-white p-4 shadow-sm"
>
  <div
    class="flex size-12 items-center justify-center rounded-full border-[3px] border-brand bg-paper"
    aria-hidden="true"
  >
    <Loader size={20} class="animate-spin text-brand" />
  </div>

  <div class="flex w-full flex-col items-center gap-1 text-center">
    <h2 class="m-0 font-display text-xl font-bold text-ink">
      Processing Payment...
    </h2>
    <p class="m-0 text-[12px] leading-snug text-ink-secondary">{subtitle}</p>
  </div>

  <div
    class="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-brand bg-[#fff7ed] px-3 py-2.5"
  >
    <p
      class="m-0 text-[10px] font-bold uppercase tracking-wide text-ink-secondary"
    >
      Your Personal Payment Code
    </p>
    <div class="flex w-full flex-wrap items-center justify-center gap-2">
      <p class="m-0 font-display text-2xl font-bold text-brand">{ussdCode}</p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-paper-border bg-white px-2.5 py-1.5 text-[12px] font-extrabold text-brand cursor-pointer hover:bg-paper"
        on:click={copyUssd}
      >
        <Copy size={14} class="shrink-0" />
        Copy
      </button>
    </div>
  </div>

  <div class="flex w-full flex-col gap-2 py-1 text-[12px]">
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Transaction Ref</span>
      <span class="truncate font-bold text-ink">{transactionRef}</span>
    </div>
    <div class="flex items-center justify-between gap-3">
      <span class="text-ink-secondary">Mobile Carrier</span>
      <span class="font-bold text-ink">{carrier}</span>
    </div>
  </div>

  {#if steps?.length}
    <div class="flex w-full flex-col gap-2">
      <p class="m-0 text-[13px] font-extrabold text-ink">What to expect next</p>
      <ol class="m-0 flex list-none flex-col gap-2 p-0">
        {#each steps as step, i}
          <li class="flex items-start gap-2.5">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand text-[11px] font-extrabold text-white"
            >
              {i + 1}
            </span>
            <p class="m-0 text-[12px] leading-snug text-ink-secondary">{step}</p>
          </li>
        {/each}
      </ol>
    </div>
  {/if}

  {#if tips?.length}
    <div
      class="flex w-full flex-col gap-2 rounded-lg border border-paper-border bg-paper px-3 py-2.5"
    >
      <p class="m-0 text-[12px] font-extrabold text-ink">Helpful tips</p>
      <ul class="m-0 flex list-none flex-col gap-2 p-0">
        {#each tips as tip}
          <li class="flex items-start gap-2">
            <span
              class="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
              aria-hidden="true"
            ></span>
            <p class="m-0 text-[11px] leading-snug text-ink-secondary">{tip}</p>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

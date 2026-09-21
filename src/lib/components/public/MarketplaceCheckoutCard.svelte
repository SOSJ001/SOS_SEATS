<script>
  // @ts-nocheck
  /**
   * Marketplace buyer Secure Checkout — desktop 55:471 / mobile 4:407.
   */
  import Lock from "lucide-svelte/icons/lock";
  import Phone from "lucide-svelte/icons/phone";
  import Smartphone from "lucide-svelte/icons/smartphone";
  import ShieldCheck from "lucide-svelte/icons/shield-check";
  import { formatBookingFeePercent } from "$lib/fees";

  /** @type {Array<{ name: string, quantity: number, lineTotal: number }>} */
  export let lineItems = [];
  export let bookingFee = 0;
  export let totalWithFee = 0;
  export let eventName = "";
  /** @type {"orange_money" | "afrimoney"} */
  export let paymentMethod = "orange_money";
  export let phone = "";
  export let fullName = "";
  export let loading = false;
  /** @type {() => void} */
  export let onGenerate = () => {};

  $: feeLabel = formatBookingFeePercent();
  $: totalQty = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  function formatMoney(n) {
    const v = Number(n) || 0;
    return `NLe ${v.toFixed(2)}`;
  }

  function methodClass(active) {
    if (active) {
      return "border-[1.5px] border-brand bg-[#fff5f0] text-sm font-extrabold text-brand lg:border-2 lg:bg-[#fff7ed]";
    }
    return "border border-paper-border bg-white text-sm font-semibold text-ink-secondary lg:font-extrabold";
  }
</script>

<div
  class="flex w-full max-w-none flex-col gap-5 lg:max-w-[440px] lg:gap-7 lg:rounded-2xl lg:border lg:border-paper-border lg:bg-white lg:px-8 lg:pb-7 lg:pt-8 lg:shadow-[0px_8px_12px_rgba(18,4,28,0.04)]"
>
  <!-- Mobile summary (4:407) -->
  <div
    class="flex w-full flex-col gap-3 rounded-xl border border-paper-border bg-[#faf9f7] p-4 lg:hidden"
  >
    {#if eventName}
      <p class="m-0 text-base font-extrabold text-ink">
        {eventName} (x{totalQty})
      </p>
    {/if}
    <div class="flex w-full flex-col gap-2">
      {#each lineItems as item (item.name + item.quantity)}
        <div class="flex items-start justify-between text-sm">
          <span class="font-normal text-ink-secondary">{item.name}</span>
          <span class="font-semibold text-ink">{formatMoney(item.lineTotal)}</span>
        </div>
      {/each}
      <div class="flex items-start justify-between text-sm">
        <span class="font-normal text-ink-secondary">Booking Fee ({feeLabel})</span>
        <span class="font-semibold text-ink">{formatMoney(bookingFee)}</span>
      </div>
      <div class="h-px w-full bg-paper-border" aria-hidden="true"></div>
      <div class="flex items-baseline justify-between">
        <span class="text-base font-extrabold text-ink">Total Due</span>
        <span class="font-display text-[22px] font-bold text-brand"
          >{formatMoney(totalWithFee)}</span
        >
      </div>
    </div>
  </div>

  <!-- Desktop summary (55:471) -->
  <div class="hidden w-full flex-col gap-3 lg:flex">
    {#each lineItems as item (item.name + item.quantity)}
      <div class="flex items-center justify-between text-sm">
        <span class="text-[#475569]">{item.name} (Qty {item.quantity})</span>
        <span class="font-bold text-ink">{formatMoney(item.lineTotal)}</span>
      </div>
    {/each}
    <div class="flex items-center justify-between text-sm">
      <span class="text-[#475569]">Service Booking Fee ({feeLabel})</span>
      <span class="font-bold text-ink">{formatMoney(bookingFee)}</span>
    </div>
    <div class="h-px w-full bg-paper-border" aria-hidden="true"></div>
    <div class="flex items-center justify-between">
      <span class="text-base font-extrabold text-ink">Total Due</span>
      <span class="font-display text-[26px] font-bold text-brand"
        >{formatMoney(totalWithFee)}</span
      >
    </div>
  </div>

  <div class="flex w-full flex-col gap-3 lg:gap-4">
    <div class="hidden items-center gap-2.5 lg:flex">
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#fff1eb] text-brand"
      >
        <Lock size={18} />
      </span>
      <h2 class="m-0 text-lg font-extrabold text-ink">Secure Checkout</h2>
    </div>

    <div class="flex flex-col gap-3">
      <p
        class="m-0 text-xs font-bold uppercase tracking-wide text-ink-secondary lg:text-[13px]"
      >
        Select Payment Method
      </p>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-xl p-3.5 {methodClass(
            paymentMethod === 'orange_money'
          )}"
          on:click={() => (paymentMethod = "orange_money")}
        >
          Orange Money
        </button>
        <button
          type="button"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-xl p-3.5 {methodClass(
            paymentMethod === 'afrimoney'
          )}"
          on:click={() => (paymentMethod = "afrimoney")}
        >
          Afrimoney
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2 lg:hidden">
      <label
        class="m-0 text-xs font-bold uppercase text-ink-secondary"
        for="mm-checkout-fullname"
      >
        Full name
      </label>
      <input
        id="mm-checkout-fullname"
        type="text"
        bind:value={fullName}
        placeholder="e.g. Alie Kamara"
        autocomplete="name"
        class="h-12 w-full rounded-xl border border-paper-border bg-white px-4 text-[15px] text-ink outline-none placeholder:text-ink-secondary"
      />
    </div>

    <div class="flex flex-col gap-2">
      <label
        class="m-0 text-xs font-bold uppercase text-ink-secondary lg:text-sm lg:font-medium lg:normal-case lg:text-ink"
        for="mm-checkout-phone"
      >
        <span class="lg:hidden">Confirm phone number to charge</span>
        <span class="hidden lg:inline">Mobile Money Phone Number</span>
      </label>
      <div
        class="flex h-12 items-center gap-2.5 rounded-xl border border-paper-border bg-white px-4 lg:h-[52px]"
      >
        <Phone size={18} class="hidden shrink-0 text-ink-muted lg:block" />
        <input
          id="mm-checkout-phone"
          type="tel"
          bind:value={phone}
          placeholder="+232 7X XX XX XX"
          class="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-[#999] lg:text-sm"
        />
      </div>
    </div>

    <button
      type="button"
      disabled={loading}
      class="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-brand px-6 text-[15px] font-extrabold text-white shadow-[0px_4px_4px_rgba(255,90,31,0.25)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:h-[52px] lg:font-bold lg:shadow-[0_8px_10px_rgba(255,90,31,0.15)]"
      on:click={onGenerate}
    >
      {loading ? "Creating…" : "Generate Payment Code"}
    </button>

    <div
      class="flex flex-col gap-2 rounded-xl border border-brand bg-[#fff5f0] px-4 py-3 lg:border-[rgba(255,90,31,0.1)] lg:bg-[#fff7ed]"
    >
      <div class="flex items-center gap-2">
        <Smartphone size={16} class="shrink-0 text-brand lg:text-ink" />
        <p class="m-0 text-[13px] font-bold text-[#1c0b1e] lg:text-ink">
          Next Steps
        </p>
      </div>
      <p class="m-0 text-[13px] leading-[1.4] text-ink-secondary">
        Complete the payment prompt. Tickets issue onto the guest list
        automatically.
      </p>
    </div>
  </div>

  <div
    class="hidden w-full flex-col gap-4 rounded-lg border border-paper-border bg-white px-4 py-3 lg:flex"
  >
    <div class="flex items-center gap-1.5">
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fff1eb] text-brand"
      >
        <ShieldCheck size={18} />
      </span>
      <p class="m-0 font-display text-base font-bold text-ink">Secure Payment</p>
    </div>
    <p class="m-0 text-xs text-[#808080]">
      Encrypted checkout · Fraud protection · On the guest list
    </p>
  </div>
</div>

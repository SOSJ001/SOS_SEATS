<script>
  // @ts-nocheck
  /**
   * Purchase Tickets / Select Tickets — desktop 759:1333 / 154:123, mobile 4:179 / 154:50.
   */
  import Minus from "lucide-svelte/icons/minus";
  import Plus from "lucide-svelte/icons/plus";
  import { formatBookingFeePercent } from "$lib/fees";

  /** @type {Array<{ id: string, name: string, price: number, description?: string, available_quantity?: number }>} */
  export let ticketTypes = [];
  /** @type {Record<string, number>} */
  export let selectedTickets = {};
  export let bookingFee = 0;
  export let totalWithFee = 0;
  export let ctaLabel = "Mobile money";
  export let disclaimer = "";
  export let disabled = false;
  export let loading = false;
  /** Show Orange Money / Afrimoney secondary actions under primary CTA */
  export let showMmMethods = false;
  export let processingOrangeMoney = false;
  export let processingAfrimoney = false;

  /** @type {(id: string, qty: number) => void} */
  export let onQuantityChange = () => {};
  /** @type {() => void} */
  export let onPrimary = () => {};
  /** @type {() => void} */
  export let onOrangeMoney = () => {};
  /** @type {() => void} */
  export let onAfrimoney = () => {};

  $: feeLabel = formatBookingFeePercent();

  function formatPrice(price) {
    if (price === 0 || price == null) return "Free";
    return `NLe ${Number(price).toFixed(price % 1 === 0 ? 0 : 2)}`;
  }

  function formatMoney(n) {
    const v = Number(n) || 0;
    return `NLe ${v.toFixed(2)}`;
  }

  function priceClass(price) {
    if (price === 0 || price == null) {
      return "text-[#16a34a] lg:text-brand";
    }
    return "text-brand";
  }
</script>

<div
  class="flex w-full flex-col gap-4 bg-white px-5 pb-6 pt-5 lg:gap-6 lg:rounded-2xl lg:border-[1.5px] lg:border-brand lg:bg-paper lg:p-7 lg:shadow-[0px_2px_4px_rgba(15,23,42,0.05),0px_12px_14px_rgba(15,23,42,0.1)]"
>
  <h2 class="m-0 font-display text-lg font-bold text-ink lg:text-[22px]">
    <span class="lg:hidden">Select Tickets</span>
    <span class="hidden lg:inline">Purchase Tickets</span>
  </h2>

  <div class="flex flex-col gap-4">
    {#each ticketTypes as ticket (ticket.id)}
      {@const qty = selectedTickets[ticket.id] || 0}
      {@const soldOut = (ticket.available_quantity ?? 0) <= 0}
      <div
        class="flex items-center gap-3 rounded-xl border border-paper-border bg-[#faf8f5] p-3 lg:rounded-lg lg:bg-paper-cream {soldOut
          ? 'opacity-60'
          : ''}"
      >
        <div class="min-w-0 flex-1">
          <p class="m-0 text-base font-extrabold text-ink lg:text-[15px]">
            {ticket.name}
          </p>
          {#if ticket.description}
            <p class="m-0 mt-1 text-xs text-ink-secondary">{ticket.description}</p>
          {/if}
          <p
            class="m-0 mt-1 text-[15px] font-extrabold lg:text-sm {priceClass(
              ticket.price
            )}"
          >
            {formatPrice(ticket.price)}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-paper-border bg-white text-ink disabled:opacity-40 lg:size-6 lg:rounded lg:bg-paper"
            disabled={soldOut || qty <= 0 || loading}
            aria-label="Decrease {ticket.name}"
            on:click={() => onQuantityChange(ticket.id, Math.max(0, qty - 1))}
          >
            <Minus size={14} />
          </button>
          <span
            class="min-w-[1.25rem] text-center text-base font-extrabold text-ink lg:text-sm"
            >{qty}</span
          >
          <button
            type="button"
            class="flex size-7 items-center justify-center rounded-md bg-brand text-white disabled:opacity-40 lg:size-6 lg:rounded"
            disabled={soldOut || loading}
            aria-label="Increase {ticket.name}"
            on:click={() => onQuantityChange(ticket.id, qty + 1)}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div
    class="flex flex-col gap-1.5 lg:gap-2 lg:border-t lg:border-paper-border lg:pt-4"
  >
    {#if bookingFee > 0}
      <div class="flex items-start justify-between text-sm lg:text-[13px]">
        <span class="text-ink lg:text-ink-secondary">Booking fee ({feeLabel})</span>
        <span class="text-ink-secondary lg:text-ink">{formatMoney(bookingFee)}</span>
      </div>
    {:else}
      <div class="hidden items-start justify-between text-[13px] lg:flex">
        <span class="text-ink-secondary">Booking fee ({feeLabel})</span>
        <span class="text-ink">{formatMoney(bookingFee)}</span>
      </div>
    {/if}
    <div
      class="flex items-center justify-between text-base font-bold lg:items-start lg:text-[15px] lg:font-extrabold"
    >
      <span class="text-ink">
        <span class="lg:hidden">Total</span>
        <span class="hidden lg:inline">Total Price</span>
      </span>
      <span class="text-brand">
        {totalWithFee > 0 ? formatMoney(totalWithFee) : "Free"}
      </span>
    </div>
  </div>

  <button
    type="button"
    class="flex h-[52px] w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 lg:h-auto lg:py-4"
    {disabled}
    on:click={onPrimary}
  >
    {loading ? "Please wait…" : ctaLabel}
  </button>

  {#if showMmMethods}
    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand/40 bg-paper py-3 text-sm font-bold text-brand disabled:opacity-50"
        disabled={processingOrangeMoney || loading}
        on:click={onOrangeMoney}
      >
        {processingOrangeMoney ? "Setting up…" : "Orange Money"}
      </button>
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink/20 bg-paper py-3 text-sm font-bold text-ink disabled:opacity-50"
        disabled={processingAfrimoney || loading}
        on:click={onAfrimoney}
      >
        {processingAfrimoney ? "Setting up…" : "Afrimoney"}
      </button>
    </div>
  {/if}

  {#if disclaimer}
    <p class="m-0 hidden text-xs leading-[18px] text-ink-secondary lg:block">
      {disclaimer}
    </p>
  {/if}
</div>

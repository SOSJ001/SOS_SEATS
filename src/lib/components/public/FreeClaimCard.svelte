<script>
  // @ts-nocheck
  /**
   * Marketplace free claim card — mobile 249:58 / desktop 530:108.
   */
  import Lock from "lucide-svelte/icons/lock";
  import ArrowRight from "lucide-svelte/icons/arrow-right";
  import CircleCheck from "lucide-svelte/icons/circle-check";

  export let eventName = "";
  /** Primary badge label, e.g. ticket type name or "2 types" */
  export let ticketTypeLabel = "";
  export let ticketQty = 0;
  export let fullName = "";
  export let loading = false;
  /** @type {() => void} */
  export let onClaim = () => {};
</script>

<div
  class="flex w-full max-w-none flex-col gap-5 lg:max-w-[440px] lg:gap-6 lg:rounded-2xl lg:border lg:border-paper-border lg:bg-white lg:px-8 lg:pb-7 lg:pt-8 lg:shadow-[0px_8px_12px_rgba(18,4,28,0.04)]"
>
  <div class="hidden items-center justify-between lg:flex">
    <div class="flex items-center gap-2.5">
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#fff1eb] text-brand"
      >
        <Lock size={18} />
      </span>
      <h2 class="m-0 text-lg font-extrabold text-ink">Claim Ticket</h2>
    </div>
    <span
      class="inline-flex items-center gap-2 rounded-full border border-paper-border bg-white px-2.5 py-1.5"
    >
      <span class="size-2 shrink-0 rounded bg-brand" aria-hidden="true"></span>
      <span class="text-[11px] font-bold text-brand">STEP 1 OF 1</span>
    </span>
  </div>

  <div
    class="flex w-full flex-col gap-2.5 rounded-xl border border-paper-border bg-[#faf9f7] p-4"
  >
    <p class="m-0 text-[13px] font-normal text-ink-secondary">
      You are claiming a ticket for
    </p>
    <p class="m-0 text-lg font-extrabold text-ink lg:text-[18px]">{eventName}</p>
    {#if ticketTypeLabel && ticketQty > 0}
      <span
        class="inline-flex w-fit items-center gap-2 rounded-full border border-brand bg-[#fff1ec] px-2.5 py-1.5 text-xs"
      >
        <span class="font-extrabold text-brand">{ticketTypeLabel}</span>
        <span class="font-bold text-ink-secondary">• Qty: {ticketQty}</span>
      </span>
    {/if}
  </div>

  <div class="flex flex-col gap-4">
    <p class="m-0 text-[13px] font-normal leading-[1.4] text-ink-secondary">
      No account is required to claim this ticket. Complete your details below.
    </p>

    <div class="flex flex-col gap-2">
      <label
        class="m-0 text-[13px] font-bold text-ink"
        for="free-claim-name"
      >
        Your Full Name (Optional)
      </label>
      <input
        id="free-claim-name"
        type="text"
        bind:value={fullName}
        placeholder="e.g. Alie Kamara"
        autocomplete="name"
        class="h-12 w-full rounded-[10px] border border-paper-border bg-white px-4 text-[15px] text-ink outline-none placeholder:text-ink-muted"
      />
    </div>
  </div>

  <button
    type="button"
    disabled={loading}
    class="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-0 bg-brand text-[15px] font-extrabold text-white shadow-[0px_4px_4px_rgba(255,90,31,0.25)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    on:click={onClaim}
  >
    {loading ? "Claiming…" : "Claim Ticket"}
    {#if !loading}
      <ArrowRight size={16} />
    {/if}
  </button>

  <div
    class="flex gap-2.5 rounded-xl border border-[#0fba82] bg-[#edfdf2] p-3"
  >
    <CircleCheck size={18} class="mt-0.5 shrink-0 text-[#0fba82]" />
    <p class="m-0 text-xs font-normal leading-[1.4] text-[#057a56]">
      No payment needed. No booking fee. Your ticket appears on this screen. Tap
      Show entry QR.
    </p>
  </div>
</div>

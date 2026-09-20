<script>
  // @ts-nocheck
  /**
   * Checkout left hero — blur+contain event image + badge/title/meta.
   * Mobile HI-FI 389:83 top-aligned chrome; desktop full-height image panel.
   * Shared by pay-now, confirm-issue, and checkout-pending layouts.
   */
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";
  import Ticket from "lucide-svelte/icons/ticket";

  export let badge = "";
  export let title = "";
  export let date = "";
  export let location = "";
  /** @type {string | null} */
  export let image = null;
  /** Optional ticket row label, e.g. "15 tickets". Omit for pending Figma. */
  export let ticketLabel = "";
</script>

<div
  class="relative flex flex-col justify-start overflow-hidden bg-[#12041c] px-5 pb-6 pt-5 lg:w-1/2 lg:min-h-screen lg:justify-end lg:bg-slate-public lg:p-8"
>
  {#if image}
    <div class="absolute inset-0" aria-hidden="true">
      <img
        src={image}
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
      />
      <img
        src={image}
        alt=""
        class="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  {/if}
  <div
    class="absolute inset-0 bg-gradient-to-b from-[#12041c]/80 via-[#0f172a]/55 to-[#0f172a]/90 lg:from-transparent lg:via-black/40 lg:to-black/80"
    aria-hidden="true"
  ></div>
  <div class="relative z-10 flex flex-col gap-3.5 text-white lg:gap-4">
    {#if badge}
      <span
        class="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-extrabold tracking-wide lg:px-3 lg:py-1 lg:text-[11px]"
      >
        {badge}
      </span>
    {/if}
    <h1
      class="m-0 text-[28px] font-extrabold leading-[1.05] lg:text-4xl lg:leading-tight"
    >
      {title}
    </h1>
    <div class="flex flex-col gap-2.5 text-white/90">
      <div class="flex items-center gap-3">
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10"
        >
          <Calendar size={16} />
        </span>
        <div class="min-w-0">
          <p class="m-0 text-xs font-extrabold text-white/80">Date &amp; Time</p>
          <p class="m-0 text-sm text-white/90 lg:text-[13px]">{date}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="flex size-6 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10"
        >
          <MapPin size={16} />
        </span>
        <div class="min-w-0">
          <p class="m-0 text-xs font-extrabold text-white/80">Venue</p>
          <p class="m-0 text-sm text-white/90 lg:text-[13px]">
            {location || "—"}
          </p>
        </div>
      </div>
      {#if ticketLabel}
        <div class="flex items-center gap-3">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10"
          >
            <Ticket size={16} />
          </span>
          <p class="m-0 text-sm font-bold text-white/90 lg:text-[13px]">
            {ticketLabel}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>

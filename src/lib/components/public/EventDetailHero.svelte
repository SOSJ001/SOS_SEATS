<script>
  // @ts-nocheck
  /**
   * Marketplace event detail hero — blur+contain image + readability gradient,
   * left copy (badge, title, date/venue), right slot for purchase card.
   * Figma 759:1333 / 154:123.
   */
  import Sparkles from "lucide-svelte/icons/sparkles";
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";

  export let title = "";
  export let dateTime = "";
  export let venue = "";
  export let badge = "LIVE IN FREETOWN";
  /** @type {string | null} */
  export let image = null;
</script>

<section
  class="relative w-full overflow-hidden bg-slate-public px-5 pb-10 pt-10 md:px-20 md:pb-14 md:pt-[72px]"
>
  {#if image}
    <div class="absolute inset-0" aria-hidden="true">
      <img
        src={image}
        alt=""
        class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
      />
      <img
        src={image}
        alt=""
        class="absolute inset-0 size-full max-w-none object-contain"
      />
    </div>
  {/if}
  <div
    class="pointer-events-none absolute inset-0"
    style="background-image: linear-gradient(150deg, rgba(15, 23, 42, 0) 25%, rgba(15, 23, 42, 0.8) 75%)"
    aria-hidden="true"
  ></div>

  <div
    class="relative z-10 flex flex-col items-stretch gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[720px]">
      {#if badge}
        <span
          class="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-extrabold text-white"
        >
          <Sparkles size={14} class="shrink-0" aria-hidden="true" />
          {badge}
        </span>
      {/if}
      <h1
        class="m-0 font-display text-[32px] font-bold leading-[1.1] text-white md:text-[56px]"
      >
        {title}
      </h1>
      {#if dateTime || venue}
        <div class="flex w-full flex-col gap-2.5">
          {#if dateTime}
            <div class="flex items-center gap-3">
              <div
                class="flex size-6 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08]"
                aria-hidden="true"
              >
                <Calendar size={16} class="text-white" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="m-0 text-xs font-extrabold text-white/80">Date &amp; Time</p>
                <p class="m-0 text-sm font-normal text-white/90">{dateTime}</p>
              </div>
            </div>
          {/if}
          {#if venue}
            <div class="flex items-center gap-3">
              <div
                class="flex size-6 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08]"
                aria-hidden="true"
              >
                <MapPin size={16} class="text-white" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="m-0 text-xs font-extrabold text-white/80">Venue</p>
                <p class="m-0 text-sm font-normal text-white/90">{venue}</p>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="w-full shrink-0 lg:w-[400px]">
      <slot />
    </div>
  </div>
</section>

<script>
  // @ts-nocheck
  /**
   * Transfer hero card, shared by "Your Next Transfer" (desktop 606:1514, mobile 624:1347),
   * "Most Recent Transfer" (desktop 606:1343, mobile 311:174) and "Ticket Being Transferred" (desktop 609:1344).
   * Desktop: image right, dense per hifi-density. Mobile: full-bleed, image top, optional badge slot.
   * Image uses blur + contain (event-image-blur-contain), no dark overlay.
   */
  export let eyebrow = "";
  export let title = "";
  export let meta = "";
  /** @type {string | null} */
  export let image = null;
  export let primaryLabel = "";
  /** @type {() => void} */
  export let onPrimary = () => {};
  /** When set, the primary renders as a link instead of a button. */
  export let primaryHref = "";
  export let primaryDisabled = false;
  export let secondaryLabel = "";
  /** When set, the secondary renders as a link; otherwise as plain text. */
  export let secondaryHref = "";
</script>

{#if title}
  <section
    class="-mx-5 flex w-[calc(100%+2.5rem)] flex-col-reverse items-stretch gap-4 rounded-[20px] border border-paper-border bg-gradient-to-r from-brand-soft to-[#fffbf5] p-5 shadow-[0_8px_12px_rgba(0,0,0,0.05)] md:-mx-20 md:w-[calc(100%+10rem)] lg:mx-0 lg:w-full lg:flex-row lg:items-center lg:gap-5 lg:p-4"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-3 lg:gap-3.5">
      {#if $$slots.badge}
        <div class="flex lg:hidden">
          <slot name="badge" />
        </div>
      {/if}

      <div class="flex flex-col gap-1.5">
        {#if eyebrow}
          <p
            class="m-0 text-sm font-extrabold uppercase leading-tight tracking-[1px] text-brand lg:leading-5"
          >
            {eyebrow}
          </p>
        {/if}
        <h2 class="m-0 text-[22px] font-extrabold leading-tight text-ink lg:text-2xl">
          {title}
        </h2>
        {#if meta}
          <p class="m-0 text-sm leading-tight text-ink-secondary lg:leading-5">{meta}</p>
        {/if}
      </div>

      {#if primaryLabel || secondaryLabel}
        <div class="flex w-full flex-col items-center gap-2 lg:w-auto lg:flex-row lg:gap-3">
          {#if primaryLabel}
            {#if primaryDisabled}
              <button
                type="button"
                disabled
                class="w-full cursor-not-allowed rounded-lg border border-paper-border bg-paper-cream px-6 py-3 text-sm font-bold leading-tight text-ink-secondary lg:w-auto lg:px-3 lg:py-2 lg:text-[13px] lg:leading-5"
              >
                {primaryLabel}
              </button>
            {:else if primaryHref}
              <a
                href={primaryHref}
                class="w-full rounded-lg bg-brand px-6 py-3 text-center text-sm font-bold leading-tight text-white no-underline hover:opacity-90 lg:w-auto lg:px-3 lg:py-2 lg:text-[13px] lg:leading-5"
              >
                {primaryLabel}
              </a>
            {:else}
              <button
                type="button"
                class="w-full cursor-pointer rounded-lg border-0 bg-brand px-6 py-3 text-sm font-bold leading-tight text-white hover:opacity-90 lg:w-auto lg:px-3 lg:py-2 lg:text-[13px] lg:leading-5"
                on:click={onPrimary}
              >
                {primaryLabel}
              </button>
            {/if}
          {/if}
          {#if secondaryLabel}
            {#if secondaryHref}
              <a
                href={secondaryHref}
                class="w-full text-center text-sm font-semibold leading-tight text-brand underline hover:opacity-90 lg:w-auto lg:text-left lg:text-[13px] lg:leading-5 lg:text-ink-secondary lg:hover:text-brand"
              >
                {secondaryLabel}
              </a>
            {:else}
              <span
                class="w-full text-center text-sm font-semibold leading-tight text-brand lg:w-auto lg:text-left lg:text-[13px] lg:leading-5 lg:text-ink-secondary"
              >
                {secondaryLabel}
              </span>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    <div
      class="relative h-[231px] w-full shrink-0 overflow-hidden rounded-xl border border-paper-border lg:h-[160px] lg:w-[280px] lg:rounded-2xl"
    >
      {#if image}
        <img
          src={image}
          alt=""
          class="pointer-events-none absolute inset-0 size-full max-w-none scale-110 object-cover blur-xl"
          aria-hidden="true"
        />
        <img
          src={image}
          alt="Event cover"
          class="absolute inset-0 size-full max-w-none object-contain"
        />
      {:else}
        <div class="absolute inset-0 bg-slate-public" aria-hidden="true"></div>
      {/if}
    </div>
  </section>
{/if}

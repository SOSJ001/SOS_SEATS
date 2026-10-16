<script>
  // @ts-nocheck
  /** @type {number} */
  export let n;
  /** @type {string} */
  export let title;
  /** @type {string} */
  export let shortBody;
  /** @type {string} */
  export let longBody;
  /** @type {string} */
  export let desktopSrc;
  /** @type {string} */
  export let mobileSrc;
  /** @type {boolean} */
  export let showDivider = true;
  /** When set, each “My Tickets” in the body becomes a link. */
  export let ticketsHref = "";

  const linkLabel = "My Tickets";
  const linkClass =
    "font-semibold text-brand underline-offset-2 hover:underline";
</script>

<article class="flex flex-col gap-3 py-5 lg:flex-row lg:items-center lg:gap-8 lg:py-7">
  <div class="flex min-w-0 flex-1 gap-3 lg:gap-4">
    <span
      class="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white lg:size-8 lg:text-sm"
      aria-hidden="true"
    >
      {n}
    </span>
    <div class="min-w-0 flex-1">
      <h2 class="m-0 text-[15px] font-bold leading-snug text-ink lg:text-lg">{title}</h2>
      <p class="m-0 mt-1 text-[13px] leading-[18px] text-ink-muted lg:hidden">
        {#if ticketsHref}
          {#each shortBody.split(linkLabel) as part, i}
            {#if i > 0}<a href={ticketsHref} class={linkClass}>{linkLabel}</a>{/if}{part}
          {/each}
        {:else}
          {shortBody}
        {/if}
      </p>
      <p class="m-0 mt-2 hidden text-sm leading-[22px] text-ink-muted lg:block">
        {#if ticketsHref}
          {#each longBody.split(linkLabel) as part, i}
            {#if i > 0}<a href={ticketsHref} class={linkClass}>{linkLabel}</a>{/if}{part}
          {/each}
        {:else}
          {longBody}
        {/if}
      </p>
    </div>
  </div>

  <div
    class="w-full overflow-hidden rounded-xl border border-paper-border bg-white shadow-[0_10px_24px_-12px_rgba(15,23,42,0.04)] lg:w-[480px] lg:shrink-0"
  >
    <picture>
      <source media="(min-width: 1024px)" srcset={desktopSrc} />
      <img
        src={mobileSrc}
        alt=""
        class="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </picture>
  </div>
</article>

{#if showDivider}
  <div class="h-px w-full bg-paper-border" aria-hidden="true"></div>
{/if}

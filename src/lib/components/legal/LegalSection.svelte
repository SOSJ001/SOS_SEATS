<script>
  /** Anchor id; the contents list in LegalPage links to `#${id}`. */
  export let id = "";
  /** @type {number | null} */
  export let number = null;
  export let title = "";
</script>

<section {id} class="scroll-mt-24 border-t border-paper-border pt-6 first:border-t-0 first:pt-0">
  <h2 class="m-0 mb-3 flex items-baseline gap-2 font-display text-base font-bold text-ink lg:text-lg">
    {#if number != null}
      <span class="text-brand">{number}.</span>
    {/if}
    <span>{title}</span>
  </h2>
  <div
    class="text-sm leading-6 text-ink-body lg:text-[13px] lg:leading-[22px] [&_a]:font-semibold [&_a]:text-brand [&_a]:no-underline hover:[&_a]:underline [&_li]:mb-1.5 [&_p]:m-0 [&_p]:mb-3 [&_strong]:font-bold [&_strong]:text-ink [&_ul]:m-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
  >
    <slot />
  </div>
</section>

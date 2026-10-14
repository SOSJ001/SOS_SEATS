<script>
  // @ts-nocheck
  /**
   * Organiser "no events yet" card (HI-FI recent-events-empty 1623:419).
   * Mobile: vertical, centred, full-width button. Desktop (lg): art left, copy right.
   */
  import PublicEmptyStage from "$lib/components/public/PublicEmptyStage.svelte";

  export let title = "No events yet";
  export let body =
    "Create your first event to start selling tickets. Your events will show up here.";
  export let ctaLabel = "Create New Event";
  export let ctaHref = "/dashboard/events/createEvent";
</script>

<section
  class="flex flex-col items-center gap-4 rounded-xl border border-paper-border bg-paper p-4 text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.05)] lg:flex-row lg:gap-8 lg:p-5 lg:text-left"
>
  <!-- Mobile art frame is 310:320; the 310:280 stage fills the top, cream fills the rest. -->
  <div
    class="aspect-[310/320] w-full max-w-[310px] shrink-0 overflow-hidden rounded-2xl bg-[#fef5f0] lg:hidden"
  >
    <PublicEmptyStage variant="mobile" showBadge={false} className="w-full" />
  </div>
  <div class="hidden min-w-0 lg:block lg:w-[520px] lg:shrink">
    <PublicEmptyStage showBadge={false} className="w-full" />
  </div>

  <div
    class="flex w-full min-w-0 flex-col items-center gap-4 lg:min-w-[220px] lg:flex-1 lg:items-start"
  >
    <div class="flex w-full flex-col gap-2">
      <h2 class="m-0 text-[16px] font-bold leading-[22px] text-ink">{title}</h2>
      <p class="m-0 text-[13px] leading-[18px] text-ink-secondary">{body}</p>
    </div>
    <a
      href={ctaHref}
      class="flex w-full items-center justify-center rounded-[10px] bg-brand px-6 py-3 text-[14px] font-bold text-white no-underline drop-shadow-[0_8px_9px_rgba(255,90,31,0.2)] transition-opacity hover:opacity-90 lg:w-auto"
    >
      {ctaLabel}
    </a>
  </div>
</section>

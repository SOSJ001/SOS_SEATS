<script>
  // @ts-nocheck
  /**
   * "Event Organiser Toolkit" banner (HI-FI 55:924), desktop dashboard.
   */
  import BriefcaseBusiness from "lucide-svelte/icons/briefcase-business";
</script>

<section
  class="flex items-center justify-between gap-6 rounded-xl border border-paper-border bg-gradient-to-r from-[#fff7f1] to-[#fff4ed] p-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.05)]"
>
  <div class="flex min-w-0 max-w-[500px] flex-col gap-1">
    <div class="flex items-center gap-2.5">
      <BriefcaseBusiness class="size-[18px] shrink-0 text-brand" aria-hidden="true" />
      <h2 class="m-0 text-[16px] font-extrabold text-ink">Event Organiser Toolkit</h2>
    </div>
    <p class="m-0 text-[13px] text-ink-secondary">
      Publish events, manage ticket configurations, and track real-time audience payouts.
    </p>
  </div>
  <div class="flex shrink-0 items-center gap-3">
    <a
      href="/dashboard/events/createEvent"
      class="rounded-[10px] bg-brand px-6 py-3 text-[14px] font-bold text-white no-underline drop-shadow-[0_8px_9px_rgba(255,90,31,0.2)] transition-opacity hover:opacity-90"
    >
      Create New Event
    </a>
    <a
      href="/dashboard/wallet"
      class="rounded-[10px] border-[1.5px] border-brand bg-[#fff4ed] px-6 py-3 text-[14px] font-bold text-brand no-underline transition-colors hover:bg-white"
    >
      View Wallet Details
    </a>
  </div>
</section>

<script>
  // @ts-nocheck
  /**
   * Recent Activity card (HI-FI 1615:262): populated list or empty state.
   */
  import Clock from "lucide-svelte/icons/clock";
  import ActivityItem from "./ActivityItem.svelte";

  /** @type {{ type: string, message: string, details?: string, time: string }[]} */
  export let activities = [];

  const TIPS = [
    "Create and publish events to start selling tickets",
    "Check in guests at your events",
    "Monitor your event performance",
  ];
</script>

<section
  class="flex flex-col gap-4 rounded-xl border border-paper-border bg-paper p-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.05)] lg:p-5 {activities.length
    ? 'pb-1 lg:pb-1'
    : ''}"
>
  <h2 class="m-0 text-[18px] font-extrabold leading-6 text-ink">Recent Activity</h2>

  {#if activities.length}
    <div class="flex flex-col">
      {#each activities as activity, i}
        <ActivityItem
          type={activity.type}
          message={activity.message}
          details={activity.details}
          time={activity.time}
          showConnector={i < activities.length - 1}
        />
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center gap-2 rounded-xl bg-[#fff0eb] px-4 py-6 text-center">
      <div class="flex size-11 items-center justify-center rounded-full bg-paper lg:size-12">
        <Clock class="size-[22px] text-brand lg:size-6" aria-hidden="true" />
      </div>
      <p class="m-0 text-[16px] font-bold leading-[22px] text-ink">No Recent Activity</p>
      <p class="m-0 text-[13px] leading-[18px] text-ink-secondary">
        Recent ticket sales, guest check-ins, and event updates will appear here.
      </p>
      <ul class="m-0 flex list-none flex-col gap-1 p-0 pt-1 text-[12px] leading-4 text-ink-muted">
        {#each TIPS as tip}
          <li>• {tip}</li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

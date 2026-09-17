<script>
  // @ts-nocheck
  /**
   * Landing Upcoming empty state.
   * Mobile: HI-FI 880:2044. Desktop lg+: HI-FI 879:1936.
   * Stage motion: Animation Spec 912:1852 via PublicEmptyStage.
   */
  import PublicEmptyStage from "$lib/components/public/PublicEmptyStage.svelte";
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
  import { goto } from "$app/navigation";
  import { sessionFromDb } from "$lib/store";

  const MOBILE_TAGS = [
    "Concerts",
    "Comedy",
    "Tech",
    "Workshops",
    "Food",
    "& more",
  ];

  const DESKTOP_TAGS = [
    "Concerts",
    "Comedy",
    "Tech meetups",
    "Workshops",
    "Food festivals",
  ];

  $: isLoggedIn = !!$sessionFromDb;

  function onCreateEvent() {
    if (isLoggedIn) goto("/dashboard/events/createEvent");
    else
      goto(
        `/sign-in?next=${encodeURIComponent("/dashboard/events/createEvent")}`
      );
  }

  function onGetNotified() {
    goto("/sign-up");
  }
</script>

<!-- Mobile empty (880:2044) -->
<div
  class="lg:hidden bg-[#faf9f7] border border-paper-border rounded-[20px] overflow-hidden px-5 py-6 flex flex-col gap-5 items-center justify-center"
>
  <PublicEmptyStage variant="mobile" className="w-full max-w-[310px]" />

  <div class="flex flex-col gap-2 items-center text-center w-full">
    <h3 class="m-0 font-display font-bold text-xl leading-normal text-[#0f1729] w-full">
      No Upcoming Events
    </h3>
    <p class="m-0 text-sm leading-normal text-[#6b5f78] w-full">
      Concerts, comedy shows, tech meetups, and more - all coming soon to Sierra Leone.
    </p>
  </div>

  <div class="flex flex-wrap gap-2 items-center justify-center w-full">
    {#each MOBILE_TAGS as tag}
      <span
        class="inline-flex items-center px-2.5 py-[5px] rounded-full bg-white border border-paper-border text-[11px] font-semibold text-brand whitespace-nowrap"
      >
        {tag}
      </span>
    {/each}
  </div>

  <div class="flex flex-col gap-2.5 items-center w-full">
    <button
      type="button"
      class="w-full px-6 py-3 bg-brand text-white text-[15px] font-bold rounded-xl shadow-public-step border-0 cursor-pointer"
      on:click={onCreateEvent}
    >
      Create an Event
    </button>
    <button
      type="button"
      class="w-full px-6 py-3 bg-transparent text-[#0f1729] text-[15px] font-semibold rounded-xl border-[1.5px] border-paper-border cursor-pointer"
      on:click={onGetNotified}
    >
      Get Notified
    </button>
  </div>

  <p class="m-0 text-xs text-center text-[rgba(107,94,120,0.6)]">
    Events will appear here as organisers publish them.
  </p>
</div>

<!-- Desktop empty (879:1936) -->
<div
  class="hidden lg:flex bg-[#faf9f7] border border-paper-border rounded-3xl shadow-public-card overflow-hidden p-6 md:p-10 flex-col lg:flex-row gap-8 items-center"
>
  <div class="flex flex-col gap-5 w-full max-w-[520px] shrink-0">
    <PublicEmptyStage />

    <div class="flex flex-wrap gap-2.5">
      {#each DESKTOP_TAGS as tag}
        <span
          class="inline-flex items-center px-3 py-2 rounded-full bg-[#fff5f0] border border-[rgba(255,90,31,0.2)] text-xs font-bold text-brand"
        >
          {tag}
        </span>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-5 flex-1 min-w-0 w-full">
    <div class="flex flex-col gap-3">
      <h3 class="m-0 font-display font-bold text-[clamp(24px,3vw,32px)] leading-[1.2] text-ink">
        The stage is set - Sierra Leone's best events are coming soon.
      </h3>
      <p class="m-0 text-base leading-normal text-ink-body">
        We're launching with a fresh lineup of concerts, comedy shows, tech meetups, workshops, and
        food festivals. Follow your favourite organisers to be the first to know when tickets go
        live.
      </p>
    </div>

    <div
      class="flex gap-3 items-center bg-paper border border-paper-border rounded-2xl p-4"
    >
      <div
        class="shrink-0 size-10 rounded-[20px] bg-[#fff5f0] flex items-center justify-center"
      >
        <PublicIcon name="users" size={20} color="#ff5a1f" />
      </div>
      <div class="flex flex-col gap-1 min-w-0">
        <p class="m-0 text-sm font-bold text-ink">Organisers, start here</p>
        <p class="m-0 text-[13px] leading-normal text-ink-body">
          Create your first event and publish it to the feed. We'll notify attendees as soon as
          tickets are live.
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-3 w-full">
      <button
        type="button"
        class="w-full h-[52px] bg-brand text-white text-base font-bold rounded-xl shadow-public-step border-0 cursor-pointer"
        on:click={onCreateEvent}
      >
        Create an Event
      </button>
      <button
        type="button"
        class="w-full h-[52px] bg-transparent text-ink text-base font-semibold rounded-xl border-[1.5px] border-paper-border cursor-pointer"
        on:click={onGetNotified}
      >
        Get Notified
      </button>
    </div>

    <p class="m-0 text-[13px] text-ink-body">
      First events will appear here automatically.
    </p>
  </div>
</div>

<script>
  // @ts-nocheck
  /**
   * Marketplace catalog empty panel.
   * Mobile: HI-FI 884:2021 inside 884:1914. Desktop: HI-FI 879:2302.
   * Stage motion: Animation Spec 912:1852 via PublicEmptyStage.
   */
  import PublicEmptyStage from "$lib/components/public/PublicEmptyStage.svelte";
  import { goto } from "$app/navigation";
  import { sessionFromDb } from "$lib/store";

  const MOBILE_TAGS = ["Concerts", "Comedy", "Tech", "Workshops", "Food"];

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

<!-- Mobile empty (884:2021) -->
<div
  class="md:hidden w-full bg-[#faf9f7] border border-paper-border rounded-[20px] overflow-hidden px-5 py-6 flex flex-col gap-5 items-center justify-center"
>
  <PublicEmptyStage variant="mobile" className="w-full max-w-[310px]" />

  <div class="flex flex-col gap-2 items-center text-center w-full">
    <h2 class="m-0 font-display font-bold text-xl leading-normal text-[#0f1729] w-full">
      No Upcoming Events
    </h2>
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
      class="w-full py-3 bg-brand text-white text-[15px] font-bold rounded-xl shadow-public-step border-0 cursor-pointer"
      on:click={onCreateEvent}
    >
      Create an Event
    </button>
    <button
      type="button"
      class="w-full py-3 bg-transparent text-[#0f1729] text-[15px] font-semibold rounded-xl border-[1.5px] border-paper-border cursor-pointer"
      on:click={onGetNotified}
    >
      Get Notified
    </button>
  </div>

  <p class="m-0 text-xs text-center text-[rgba(107,94,120,0.6)]">
    Events will appear here as organisers publish them.
  </p>
</div>

<!-- Desktop empty (879:2302) -->
<div
  class="hidden md:flex w-full bg-[#faf9f7] border border-paper-border rounded-[24px] flex-col items-center gap-8 px-6 py-10 md:px-12 md:py-14 overflow-hidden"
>
  <div class="w-full max-w-[500px]">
    <PublicEmptyStage />
  </div>

  <div class="flex flex-col gap-3 items-center text-center max-w-[513px]">
    <h2 class="m-0 font-display font-bold text-2xl leading-normal text-[#0f1729]">
      No events yet - but the stage is set
    </h2>
    <p class="m-0 text-[15px] leading-relaxed text-[#6b5f78]">
      Sierra Leone's event scene is about to light up. Concerts, comedy shows, tech meetups,
      workshops, and food festivals - all coming soon.
    </p>
  </div>

  <div class="flex flex-wrap gap-4 items-center justify-center">
    <button
      type="button"
      class="bg-brand text-white text-[15px] font-bold px-7 py-3.5 rounded-xl border-0 cursor-pointer shadow-public-card"
      on:click={onCreateEvent}
    >
      Create an Event
    </button>
    <button
      type="button"
      class="bg-transparent text-[#0f1729] text-[15px] font-semibold px-7 py-3.5 rounded-xl border-[1.5px] border-paper-border cursor-pointer"
      on:click={onGetNotified}
    >
      Get Notified
    </button>
  </div>

  <p class="m-0 text-[13px] text-center text-[rgba(107,94,120,0.7)]">
    Events will appear here as organisers publish them.
  </p>
</div>

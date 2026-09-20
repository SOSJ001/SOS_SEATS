<script>
  // @ts-nocheck
  /** Event hub — Overview | Guests | Generate (mobile 208:58 / 374:160 / 208:219; desktop 199:56 / 527:621 / 199:350). */
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import EventHubHero from "$lib/components/organizer/EventHubHero.svelte";
  import EventHubTabs from "$lib/components/organizer/EventHubTabs.svelte";
  import EventHubOverview from "$lib/components/organizer/EventHubOverview.svelte";
  import EventHubGuests from "$lib/components/organizer/EventHubGuests.svelte";
  import EventHubGenerate from "$lib/components/organizer/EventHubGenerate.svelte";
  import { organiserTopbarTitle } from "$lib/client/organiserUi";

  export let data;

  $: event = data.event;
  $: error = data.error;
  $: walletBalance = data.walletBalance ?? 0;
  $: tabParam = $page.url.searchParams.get("tab") || data.tab || "overview";
  $: activeTab = ["overview", "guests", "generate"].includes(tabParam)
    ? tabParam
    : "overview";

  onMount(() => {
    if (event?.title) organiserTopbarTitle.set(event.title);
  });

  onDestroy(() => {
    organiserTopbarTitle.set(null);
  });

  $: if (event?.title) {
    organiserTopbarTitle.set(event.title);
  }
</script>

{#if error || !event}
  <div
    class="mx-auto max-w-lg rounded-2xl border border-paper-border bg-paper p-8 text-center"
  >
    <h2 class="m-0 text-xl font-bold text-ink">Event not found</h2>
    <p class="mt-2 text-sm text-ink-secondary">
      {error || "Missing event id."}
    </p>
    <a
      href="/dashboard/events"
      class="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white no-underline"
    >
      Back to Events
    </a>
  </div>
{:else}
  <!-- Hero → tabs → body (Figma PageBody mobile + desktop). -->
  <div class="-mx-4 -mt-4 flex flex-col md:-mx-6 md:-mt-6">
    <div
      class="flex flex-col gap-4 bg-public-page px-4 py-6 md:px-8 md:py-8 lg:gap-8"
    >
      <EventHubHero {event} />
      <EventHubTabs eventId={event.id} active={activeTab} />
      {#if activeTab === "overview"}
        <EventHubOverview {event} />
      {:else if activeTab === "guests"}
        <EventHubGuests {event} />
      {:else}
        <EventHubGenerate {event} {walletBalance} />
      {/if}
    </div>
  </div>
{/if}

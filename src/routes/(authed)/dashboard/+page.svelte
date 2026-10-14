<script>
  // @ts-nocheck
  /**
   * Organiser Dashboard Overview (HI-FI 55:857 desktop, 469:80 mobile;
   * empty 1615:5197 / 1615:5496).
   */
  import { sessionFromDb } from "$lib/store";
  import Layers from "lucide-svelte/icons/layers";
  import Ticket from "lucide-svelte/icons/ticket";
  import Wallet from "lucide-svelte/icons/wallet";
  import { formatNle } from "$lib/client/walletFormat";
  import ShareEventModal from "$lib/components/ShareEventModal.svelte";
  import DashboardStatCard from "$lib/components/organizer/dashboard/DashboardStatCard.svelte";
  import OrganiserToolkitBanner from "$lib/components/organizer/dashboard/OrganiserToolkitBanner.svelte";
  import RecentActivityCard from "$lib/components/organizer/dashboard/RecentActivityCard.svelte";
  import OrganiserEventCard from "$lib/components/organizer/events/OrganiserEventCard.svelte";
  import RecentEventsEmpty from "$lib/components/organizer/events/RecentEventsEmpty.svelte";
  import {
    mapOrganiserEvent,
    isActiveStatus,
  } from "$lib/components/organizer/events/mapOrganiserEvent.js";

  export let data;

  if (data.user_Id !== undefined) {
    sessionFromDb.set(data.user_Id);
  }

  $: organiserName = data.userName || "";
  $: events = (data.events || []).map(mapOrganiserEvent);
  $: recentActivities = data.recentActivities || [];

  $: totalEvents = events.length;
  $: activeEvents = events.filter((e) => isActiveStatus(e.status)).length;
  $: ticketsSold = events.reduce((sum, e) => sum + e.ticketsSold, 0);
  $: capacity = events.reduce((sum, e) => sum + e.capacity, 0);
  $: revenue = events.reduce((sum, e) => sum + e.revenueValue, 0);
  $: hasCapacity = capacity > 0 || ticketsSold === 0;
  $: soldPct = hasCapacity
    ? `${capacity > 0 ? +((ticketsSold / capacity) * 100).toFixed(1) : 0}%`
    : "";

  $: recentEvents = [...events]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3);

  let showShareModal = false;
  let selectedEventForSharing = null;

  function shareEvent(event) {
    selectedEventForSharing = event;
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
    selectedEventForSharing = null;
  }
</script>

<svelte:head>
  <title>Dashboard - SOS SEATS</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <!-- Stats -->
  <div class="grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-4">
    <DashboardStatCard
      label="Total Events"
      value={totalEvents.toLocaleString()}
      pill="{activeEvents} active"
      icon={Layers}
      tone="brand"
    />
    <DashboardStatCard
      label="Tickets Sold"
      value={hasCapacity
        ? `${ticketsSold.toLocaleString()} / ${capacity.toLocaleString()}`
        : ticketsSold.toLocaleString()}
      pill={soldPct}
      icon={Ticket}
      tone="green"
    />
    <DashboardStatCard
      label="Total Revenue"
      value={formatNle(revenue)}
      pill="All sales"
      icon={Wallet}
      tone="blue"
    />
  </div>

  <div class="hidden lg:block">
    <OrganiserToolkitBanner />
  </div>

  <!-- My Recent Events -->
  <section class="flex flex-col gap-3 lg:gap-4">
    <div class="flex items-center justify-between gap-4">
      <h2 class="m-0 text-[18px] font-extrabold text-ink">My Recent Events</h2>
      {#if recentEvents.length}
        <a
          href="/dashboard/events"
          class="text-[13px] text-brand underline lg:font-bold"
        >
          <span class="lg:hidden">See All</span>
          <span class="hidden lg:inline">See All Events</span>
        </a>
      {/if}
    </div>

    {#if recentEvents.length}
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {#each recentEvents as event (event.id)}
          <OrganiserEventCard {event} {organiserName} on:share={() => shareEvent(event)} />
        {/each}
      </div>
    {:else}
      <RecentEventsEmpty />
    {/if}
  </section>

  <RecentActivityCard activities={recentActivities} />
</div>

<ShareEventModal
  event={selectedEventForSharing}
  isOpen={showShareModal}
  on:close={closeShareModal}
/>

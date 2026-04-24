<script>
  // @ts-nocheck
  import { sessionFromDb } from "$lib/store";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import DashboardOverview from "$lib/components/DashboardOverview.svelte";
  import DashboardRecentActivity from "$lib/components/DashboardRecentActivity.svelte";

  export let data;

  if (data.user_Id !== undefined) {
    sessionFromDb.set(data.user_Id);
  }

  $: dashboardStats = data.dashboardStats ?? {
    liveEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    guestsCheckedIn: 0,
  };

  /** Live ops only — tickets sold & revenue live under Merchant zone */
  $: dashboardMetrics = [
    {
      icon: "calendar",
      value: dashboardStats.liveEvents.toString(),
      label: "LIVE EVENTS",
      color: "teal",
    },
    {
      icon: "users",
      value: dashboardStats.guestsCheckedIn.toLocaleString(),
      label: "GUESTS CHECKED IN",
      color: "purple",
    },
  ];

  $: displayActivities = data.recentActivities ?? [];

  let isNavigating = false;

  async function go(path) {
    if (isNavigating) return;
    isNavigating = true;
    await goto(path);
    isNavigating = false;
  }

  const links = [
    {
      href: "/dashboard/merchant",
      title: "Merchant zone",
      desc: "Tickets sold, revenue, and per-event sales. Scanner and guest tools link from here too.",
      accent: "from-cyan-600/30 to-purple-600/30 border-cyan-500/40",
      featured: true,
    },
    {
      href: "/dashboard/my-tickets",
      title: "My tickets",
      desc: "Tickets you have bought or received.",
      accent: "bg-gray-800/80 border-gray-600",
      featured: false,
    },
    {
      href: "/dashboard/wallet",
      title: "Wallet",
      desc: "Balances and withdrawals.",
      accent: "bg-gray-800/80 border-gray-600",
      featured: false,
    },
    {
      href: "/dashboard/events",
      title: "Events",
      desc: "Browse and manage events you care about.",
      accent: "bg-gray-800/80 border-gray-600",
      featured: false,
    },
    {
      href: "/marketplace",
      title: "Marketplace",
      desc: "Discover public events and buy tickets.",
      accent: "bg-gray-800/80 border-gray-600",
      featured: false,
    },
    {
      href: "/dashboard/settings",
      title: "Settings",
      desc: "Account and preferences.",
      accent: "bg-gray-800/80 border-gray-600",
      featured: false,
    },
  ];
</script>

<svelte:head>
  <title>Dashboard - SOS SEATS</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8" in:fade={{ duration: 300 }}>
  <div>
    <h1 class="text-3xl font-bold text-white tracking-tight">Welcome</h1>
    <p class="text-gray-400 mt-2 max-w-2xl">
      Use the shortcuts below. Live event and check-in counts are here; open
      <strong class="text-gray-200">Merchant zone</strong> for tickets sold, revenue, and your
      event cards.
    </p>
  </div>

  <DashboardOverview title="At a glance" metrics={dashboardMetrics} />

  <DashboardRecentActivity activities={displayActivities} />

  <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <h2 class="text-xl font-bold text-white mb-4">Organizer quick actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        type="button"
        class="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
        disabled={isNavigating}
        on:click={() => go("/dashboard/events/createEvent")}
      >
        Create event
      </button>
      <button
        type="button"
        class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
        disabled={isNavigating}
        on:click={() => go("/dashboard/scanner")}
      >
        Scan tickets
      </button>
      <button
        type="button"
        class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
        disabled={isNavigating}
        on:click={() => go("/dashboard/guests")}
      >
        Manage guests
      </button>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-semibold text-white mb-3">Shortcuts</h2>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each links as item}
      <a
        href={item.href}
        class="block rounded-xl border p-5 transition hover:border-cyan-500/50 hover:bg-gray-800/60 {item.accent} {item.featured ? 'ring-1 ring-cyan-500/30' : ''}"
      >
        <h2 class="text-lg font-semibold text-white">{item.title}</h2>
        <p class="text-sm text-gray-400 mt-2 leading-relaxed">{item.desc}</p>
        <span class="inline-block mt-4 text-sm text-cyan-400 font-medium">Open →</span>
      </a>
    {/each}
  </div>
</div>

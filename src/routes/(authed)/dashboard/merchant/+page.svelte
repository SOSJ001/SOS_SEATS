<script lang="ts">
  import { fade } from "svelte/transition";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import DashboardOverview from "$lib/components/DashboardOverview.svelte";

  export let data: PageData;

  /** Merged from parent `dashboard/+layout.server` */
  type LayoutStats = {
    liveEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
    guestsCheckedIn: number;
  };

  $: dashboardStats = (data as PageData & { dashboardStats?: LayoutStats })
    .dashboardStats ?? {
    liveEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    guestsCheckedIn: 0,
  };

  const fallbackImg =
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop";

  function formatCurrency(amount: number | string) {
    const numAmount = parseFloat(String(amount)) || 0;
    if (numAmount >= 1000000) {
      return `NLe ${(numAmount / 1000000).toFixed(2)}M`;
    }
    if (numAmount >= 1000) {
      return `NLe ${(numAmount / 1000).toFixed(0)}k`;
    }
    return `NLe ${numAmount.toFixed(2)}`;
  }

  /** Sales KPIs only — live events & check-ins stay on `/dashboard` */
  $: dashboardMetrics = [
    {
      icon: "ticket",
      value: dashboardStats.totalTicketsSold.toLocaleString(),
      label: "TICKETS SOLD",
      color: "blue",
    },
    {
      icon: "currency",
      value: formatCurrency(dashboardStats.totalRevenue),
      label: "TOTAL REVENUE",
      color: "green",
    },
  ];

  let isNavigating = false;

  async function go(path: string) {
    if (isNavigating) return;
    isNavigating = true;
    await goto(path);
    isNavigating = false;
  }

  function formatEventDate(date: string | null, time: string | null) {
    if (!date) return "Date not set";
    const eventDate = new Date(date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return time ? `${formattedDate} at ${time}` : formattedDate;
  }

  function statusPill(status: string | null) {
    switch (status?.toLowerCase()) {
      case "live":
      case "published":
        return "bg-green-500/20 text-green-300 border border-green-500/40";
      case "completed":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border border-red-500/40";
      case "draft":
        return "bg-yellow-500/20 text-yellow-200 border border-yellow-500/40";
      default:
        return "bg-gray-700 text-gray-300 border border-gray-600";
    }
  }
</script>

<svelte:head>
  <title>Merchant | SOS SEATS</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8" in:fade={{ duration: 200 }}>
  <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold text-white tracking-tight">Merchant zone</h1>
      <p class="text-gray-400 mt-1">
        Tickets sold and revenue across your events. Use the main dashboard for scanning, guests,
        and shortcuts.
      </p>
    </div>
    <a
      href="/dashboard"
      class="text-sm text-gray-400 hover:text-cyan-300 shrink-0"
    >
      ← Dashboard home
    </a>
  </div>

  <DashboardOverview
    title="Sales overview"
    metrics={dashboardMetrics}
  />

  <div>
    <h2 class="text-xl font-bold text-white mb-4">Your events</h2>
    {#if !data.merchantEvents.length}
      <div
        class="rounded-xl border border-dashed border-gray-600 p-10 text-center text-gray-400"
      >
        <p class="text-lg mb-4">No events yet.</p>
        <button
          type="button"
          class="text-cyan-400 hover:text-cyan-300 underline"
          on:click={() => go("/dashboard/events/createEvent")}
        >
          Create your first event
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each data.merchantEvents as ev}
          <a
            href="/dashboard/events/eventDetails?id={ev.id}"
            class="group block rounded-xl overflow-hidden border border-gray-700 bg-gray-800/40 hover:border-cyan-500/50 transition"
          >
            <div class="h-40 overflow-hidden bg-gray-900">
              <img
                src={ev.imageUrl || fallbackImg}
                alt=""
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div class="p-4 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-lg font-semibold text-white line-clamp-2">
                  {ev.name}
                </h3>
                <span
                  class={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusPill(ev.status)}`}
                >
                  {ev.status || "draft"}
                </span>
              </div>
              <p class="text-sm text-gray-400">
                {formatEventDate(ev.date, ev.time)}
              </p>
              {#if ev.location}
                <p class="text-sm text-gray-500 line-clamp-1">{ev.location}</p>
              {/if}
              <div class="flex gap-6 pt-2 text-sm">
                <div>
                  <span class="text-gray-500">Orders</span>
                  <span class="ml-2 text-white font-medium">{ev.orderCount}</span>
                </div>
                <div>
                  <span class="text-gray-500">Revenue</span>
                  <span class="ml-2 text-cyan-300 font-medium"
                    >NLe {ev.revenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

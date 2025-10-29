<script>
  import DashboardMetricCard from "./DashboardMetricCard.svelte";
  import { fade } from "svelte/transition";

  /** @type {Array<{icon: string, value: string, label: string, color: string}>} */
  export let metrics = [];
</script>

<div class="mb-8" in:fade={{ duration: 500 }}>
  <h2 class="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#if metrics && metrics.length > 0}
      {#each metrics as metric, index}
        <DashboardMetricCard
          icon={metric.icon}
          value={metric.value}
          label={metric.label}
          color={metric.color}
          delay={index * 100}
        />
      {/each}
    {:else}
      <!-- Fallback when no metrics are available -->
      <div class="col-span-full text-center text-gray-400 py-8">
        <p>Loading dashboard metrics...</p>
      </div>
    {/if}
  </div>
</div>

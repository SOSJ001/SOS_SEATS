<script>
  import DashboardMetricCard from "./DashboardMetricCard.svelte";
  import { fade } from "svelte/transition";
  
  export let metrics = [
    { icon: "calendar", value: "12", label: "LIVE EVENTS", color: "teal" },
    { icon: "ticket", value: "5,432", label: "TICKETS SOLD", color: "blue" },
    { icon: "currency", value: "$125k", label: "TOTAL REVENUE", color: "green" },
    { icon: "users", value: "4,890", label: "GUESTS CHECKED IN", color: "purple" }
  ];
</script>

<div class="mb-8" in:fade={{ duration: 500 }}>
  <h2 class="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each metrics as metric, index}
      <DashboardMetricCard
        icon={metric.icon}
        value={metric.value}
        label={metric.label}
        color={metric.color}
        delay={index * 100}
      />
    {/each}
  </div>
</div>

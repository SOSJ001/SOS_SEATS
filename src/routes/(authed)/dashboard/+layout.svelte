<script>
  import DashboardSidebar from "$lib/components/DashboardSidebar.svelte";
  import DashboardTopNav from "$lib/components/DashboardTopNav.svelte";
  import { fade } from "svelte/transition";

  export let data;

  // Set user data for the top navigation
  let userName = data.userName || "User";
  let walletBalance = "$1,234.56"; // This could come from data or be calculated
</script>

<div class="flex h-screen bg-gray-900">
  <!-- Sidebar -->
  <DashboardSidebar />

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Top Navigation -->
    <DashboardTopNav {userName} {walletBalance} />

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-gray-900 p-6">
      <div in:fade={{ duration: 300 }}>
        <slot />
      </div>
    </main>
  </div>
</div>

<script>
  import DashboardSidebar from "$lib/components/DashboardSidebar.svelte";
  import DashboardTopNav from "$lib/components/DashboardTopNav.svelte";
  import { fade } from "svelte/transition";

  export let data;

  // Set user data for the top navigation
  let userName = data.userName || "User";

  // Sidebar state for mobile
  let sidebarOpen = false;
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }
  function closeSidebar() {
    sidebarOpen = false;
  }
</script>

<div class="flex h-screen bg-gray-900">
  <!-- Sidebar (desktop) -->
  <div class="hidden lg:block">
    <DashboardSidebar {userName} />
  </div>

  <!-- Sidebar Drawer (mobile) -->
  {#if sidebarOpen}
    <div class="fixed inset-0 z-40 flex lg:hidden">
      <button
        type="button"
        class="fixed inset-0 bg-black bg-opacity-40"
        on:click={closeSidebar}
        on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
        aria-label="Close sidebar"
      ></button>
      <div
        class="relative w-64 h-full bg-gray-900 border-r border-gray-700 z-50 animate-slide-in-left"
      >
        <DashboardSidebar {userName} onClose={closeSidebar} />
      </div>
    </div>
  {/if}

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Top Navigation -->
    <DashboardTopNav {userName} onMenuToggle={toggleSidebar} />

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-gray-900 p-6">
      <div in:fade={{ duration: 300 }}>
        <slot />
      </div>
    </main>
  </div>
</div>

<style>
  @keyframes slide-in-left {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
  .animate-slide-in-left {
    animation: slide-in-left 0.2s ease-out;
  }
</style>

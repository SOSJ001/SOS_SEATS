<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let searchQuery: string = "";
  export let activeFilter: string = "all";
  export let selectedCount: number = 0;

  const filters = [
    { id: "all", label: "All" },
    { id: "checked-in", label: "Checked In" },
    { id: "pending", label: "Pending" },
    { id: "vip", label: "VIP" },
  ];

  function handleSearch() {
    dispatch("search", { query: searchQuery });
  }

  function handleFilterChange(filterId: string) {
    activeFilter = filterId;
    dispatch("filterChange", { filter: filterId });
  }

  function deleteSelected() {
    dispatch("deleteSelected");
  }
</script>

<div
  class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6"
>
  <!-- Left side: Select All and Search -->
  <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2 text-gray-300">
        <input
          type="checkbox"
          class="w-4 h-4 text-teal-400 bg-gray-700 border-gray-600 rounded focus:ring-teal-400 focus:ring-2"
        />
        <span class="text-sm">Select All</span>
      </label>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <svg
          class="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        on:input={handleSearch}
        placeholder="Search guests..."
        class="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent w-64"
      />
    </div>
  </div>

  <!-- Right side: Filters and Delete -->
  <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
    <!-- Filter Buttons -->
    <div class="flex gap-1">
      {#each filters as filter}
        <button
          on:click={() => handleFilterChange(filter.id)}
          class="px-4 py-2 rounded-lg transition-colors duration-200 text-sm {activeFilter ===
          filter.id
            ? 'bg-teal-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        >
          {filter.label}
        </button>
      {/each}
    </div>

    <!-- Delete Selected Button -->
    {#if selectedCount > 0}
      <button
        on:click={deleteSelected}
        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-2 text-sm"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Delete Selected ({selectedCount})
      </button>
    {/if}
  </div>
</div>

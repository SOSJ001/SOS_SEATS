<script>
  import { slide } from "svelte/transition";

  export let searchQuery = "";
  export let selectedCategory = "All Events";

  const categories = [
    "All Events",
    "Music & Concerts",
    "Sports & Fitness",
    "Business & Professional",
    "Technology",
    "Arts & Culture",
    "Food & Drink",
    "Education",
    "Health & Wellness",
    "Entertainment",
    "Other",
  ];

  let categoriesExpanded = false; // State for accordion on mobile

  function handleCategorySelect(category) {
    selectedCategory = category;
    // Auto-close accordion on mobile after selection
    categoriesExpanded = false;
  }
</script>

<div class="max-w-4xl mx-auto">
  <div class="mb-6">
    <div class="relative group">
      <input
        type="text"
        bind:value={searchQuery}
        on:input={(e) => {
          searchQuery = e.currentTarget.value;
        }}
        placeholder="Search for events..."
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out group-hover:border-gray-500 group-hover:bg-gray-650"
      />
      <svg
        class="absolute right-3 top-3.5 h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        ></path>
      </svg>
    </div>
  </div>

  <!-- Category Filters -->
  <!-- Mobile: Accordion Dropdown -->
  <div class="md:hidden mb-8">
    <button
      on:click={() => (categoriesExpanded = !categoriesExpanded)}
      class="w-full flex items-center justify-between px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-all duration-300 ease-out"
    >
      <div class="flex items-center gap-2">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span class="font-semibold">
          {selectedCategory === "All Events" ? "Category: All Events" : `Category: ${selectedCategory}`}
        </span>
      </div>
      <svg
        class="w-5 h-5 transition-transform duration-300 {categoriesExpanded
          ? 'rotate-180'
          : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    {#if categoriesExpanded}
      <div
        class="mt-3 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden"
        transition:slide={{ axis: "y", duration: 300 }}
      >
        <div class="max-h-64 overflow-y-auto">
          {#each categories as category, index}
            <button
              on:click={() => handleCategorySelect(category)}
              class="w-full text-left px-4 py-3 border-b border-gray-700 last:border-b-0 transition-colors duration-200 {selectedCategory ===
              category
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white font-semibold'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
            >
              <div class="flex items-center gap-2">
                {#if selectedCategory === category}
                  <svg
                    class="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {:else}
                  <div class="w-5"></div>
                {/if}
                <span>{category}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Desktop: Full Category Buttons -->
  <div class="hidden md:flex flex-wrap gap-3 mb-8">
    {#each categories as category, index}
      <button
        on:click={() => handleCategorySelect(category)}
        class="relative overflow-hidden px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg {selectedCategory ===
        category
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
          : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 hover:from-gray-600 hover:to-gray-500 hover:text-white border border-gray-600'}"
        style="transition-delay: {index * 50}ms;"
      >
        <!-- Shimmer effect for active state -->
        {#if selectedCategory === category}
          <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"
          ></div>
        {/if}

        <!-- Hover shine effect -->
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-700 ease-out hover:translate-x-full"
        ></div>

        <span class="relative z-10">{category}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  /* Custom shimmer animation */
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }

  /* Enhanced hover effects */
  button:hover {
    transform: translateY(-2px) scale(1.05);
  }

  /* Smooth transitions for all interactive elements */
  * {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>

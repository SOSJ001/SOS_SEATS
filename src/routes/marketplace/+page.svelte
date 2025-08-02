<script lang="ts">
  import EventCard from "$lib/components/EventCard.svelte";
  import SearchFilters from "$lib/components/SearchFilters.svelte";
  import { Tabs, TabItem } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { loadPublicEvents } from "$lib/supabase.js";

  // Search and filter functionality
  let searchQuery = "";
  let selectedCategory = "All Events";
  let showFilters = false;
  let pageLoaded = false;
  let cardsVisible = false;
  let heroSearchQuery = "";

  // Event data
  let allEvents = [];
  let featuredEvents = [];
  let upcomingEvents = [];
  let resaleEvents = [];
  let loading = true;

  // Filter events based on search and category
  $: filteredEvents = allEvents.filter((event: any) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Events" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  $: filteredFeaturedEvents = featuredEvents.filter((event: any) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All Events" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function handleHeroSearch() {
    searchQuery = heroSearchQuery;
    // Scroll to the main content
    document
      .getElementById("main-content")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  onMount(async () => {
    try {
      // Load public events from database
      const events = await loadPublicEvents();

      // Ensure all events have the is_free_event property
      allEvents = (events || []).map((event) => {
        const isFree =
          event.is_free_event ||
          event.price === 0 ||
          event.price === "Free" ||
          event.price === "0" ||
          event.price === "NLe 0" ||
          (typeof event.price === "string" &&
            (event.price.toLowerCase().includes("free") ||
              event.price.toLowerCase().includes("nle 0")));

        return {
          ...event,
          is_free_event: isFree,
        };
      });

      // Set featured events (first 4)
      featuredEvents = allEvents.slice(0, 4);

      // Set upcoming events (first 6)
      upcomingEvents = allEvents.slice(0, 6);

      // Set resale events (remaining events)
      resaleEvents = allEvents.slice(6);

      loading = false;
    } catch (error) {
      loading = false;
    }

    // Trigger page load animation
    setTimeout(() => {
      pageLoaded = true;
    }, 100);

    // Trigger card animations after page load
    setTimeout(() => {
      cardsVisible = true;
    }, 300);
  });
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Hero Section -->
  <div class="relative h-[70vh] min-h-[600px] overflow-hidden">
    <!-- Background Image -->
    <div class="absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        alt="Event background"
        class="w-full h-full object-cover"
      />
      <!-- Dark overlay -->
      <div class="absolute inset-0 bg-black/60"></div>
      <!-- Gradient overlay for better text readability -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"
      ></div>
    </div>

    <!-- Hero Content -->
    <div class="relative z-10 flex items-center justify-center h-full">
      <div class="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Main Heading -->
        <h1
          class="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 transition-all duration-1000 ease-out {pageLoaded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'}"
        >
          Discover Your Next Event
        </h1>

        <!-- Sub-heading -->
        <p
          class="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ease-out delay-200 {pageLoaded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'}"
        >
          Find unforgettable experiences, from concerts and festivals to
          workshops and conferences, all powered by blockchain.
        </p>

        <!-- Search Bar -->
        <!-- <div
          class="max-w-2xl mx-auto transition-all duration-1000 ease-out delay-400 {pageLoaded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'}"
        >
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
              <input
                type="text"
                bind:value={heroSearchQuery}
                placeholder="Search for events, artists, venues..."
                class="w-full px-6 py-4 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg"
                on:keydown={(e) => e.key === "Enter" && handleHeroSearch()}
              />
            </div>
            <button
              on:click={handleHeroSearch}
              class="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-2 group"
            >
              <svg
                class="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
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
              Search
            </button>
          </div>
        </div> -->
      </div>
    </div>

    <!-- Scroll indicator -->
    <div
      class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
    >
      <svg
        class="h-8 w-8 text-white/60"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        ></path>
      </svg>
    </div>
  </div>

  <!-- Main Content -->
  <div id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Search and Filters Section -->
    <div
      class="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg transition-all duration-1000 ease-out delay-600 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <SearchFilters bind:searchQuery bind:selectedCategory bind:showFilters />
    </div>

    <!-- Featured Events Section -->
    <div
      class="mb-12 transition-all duration-1000 ease-out delay-800 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <h2
        class="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
      >
        Featured Events
      </h2>

      {#if loading}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each Array(4) as _, index}
            <div class="bg-gray-800 rounded-xl p-6 animate-pulse">
              <div class="bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div class="bg-gray-700 h-4 rounded mb-2"></div>
              <div class="bg-gray-700 h-3 rounded mb-4"></div>
              <div class="bg-gray-700 h-3 rounded mb-6"></div>
              <div class="flex justify-between items-center">
                <div class="bg-gray-700 h-6 w-16 rounded"></div>
                <div class="bg-gray-700 h-10 w-24 rounded"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if filteredFeaturedEvents.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each filteredFeaturedEvents as event, index}
            <div
              class="transition-all duration-700 ease-out {cardsVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95'}"
              style="transition-delay: {index * 100}ms;"
            >
              <EventCard
                {event}
                buttonText={event.is_free_event ? "Get Free Ticket" : "Buy Now"}
              />
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-12">
          <p class="text-gray-400 text-lg">
            No featured events available at the moment.
          </p>
        </div>
      {/if}
    </div>

    <!-- All Events Section -->
    <div
      class="transition-all duration-1000 ease-out delay-1000 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <h2
        class="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
      >
        All Events
      </h2>

      <Tabs
        activeClasses="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
        inactiveClasses="bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md transform hover:scale-105"
        contentClass="bg-transparent pt-6"
        class="mb-8"
      >
        <TabItem
          open
          title="Upcoming"
          class="px-6 py-3 rounded-lg transition-all duration-300 ease-out font-semibold"
        >
          {#if loading}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each Array(6) as _, index}
                <div class="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div class="bg-gray-700 h-48 rounded-lg mb-4"></div>
                  <div class="bg-gray-700 h-4 rounded mb-2"></div>
                  <div class="bg-gray-700 h-3 rounded mb-4"></div>
                  <div class="bg-gray-700 h-3 rounded mb-6"></div>
                  <div class="flex justify-between items-center">
                    <div class="bg-gray-700 h-6 w-16 rounded"></div>
                    <div class="bg-gray-700 h-10 w-24 rounded"></div>
                  </div>
                </div>
              {/each}
            </div>
          {:else if filteredEvents.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each filteredEvents as event, index}
                <div
                  class="transition-all duration-700 ease-out {cardsVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95'}"
                  style="transition-delay: {index * 100}ms;"
                >
                  <EventCard
                    {event}
                    buttonText={event.is_free_event
                      ? "Get Free Ticket"
                      : "View Details"}
                  />
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-12">
              <p class="text-gray-400 text-lg">
                No events found matching your criteria.
              </p>
            </div>
          {/if}
        </TabItem>

        <TabItem
          title="Resales"
          class="px-6 py-3 rounded-lg transition-all duration-300 ease-out font-semibold"
        >
          {#if loading}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each Array(3) as _, index}
                <div class="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div class="bg-gray-700 h-48 rounded-lg mb-4"></div>
                  <div class="bg-gray-700 h-4 rounded mb-2"></div>
                  <div class="bg-gray-700 h-3 rounded mb-4"></div>
                  <div class="bg-gray-700 h-3 rounded mb-6"></div>
                  <div class="flex justify-between items-center">
                    <div class="bg-gray-700 h-6 w-16 rounded"></div>
                    <div class="bg-gray-700 h-10 w-24 rounded"></div>
                  </div>
                </div>
              {/each}
            </div>
          {:else if resaleEvents.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each resaleEvents as event, index}
                <div
                  class="transition-all duration-700 ease-out {cardsVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-95'}"
                  style="transition-delay: {index * 100}ms;"
                >
                  <EventCard
                    {event}
                    buttonText={event.is_free_event
                      ? "Get Free Ticket"
                      : "View Details"}
                  />
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-12">
              <p class="text-gray-400 text-lg">
                No resale events available at the moment.
              </p>
            </div>
          {/if}
        </TabItem>
      </Tabs>
    </div>
  </div>
</div>

<style>
  /* Custom animations for smooth transitions */
  :global(.transition-all) {
    transition-property: all;
  }

  :global(.duration-700) {
    transition-duration: 700ms;
  }

  :global(.ease-out) {
    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }

  /* Enhanced tab animations */
  :global(.flowbite-tabs) {
    transition: all 0.3s ease-out;
  }

  :global(.flowbite-tab-item) {
    transition: all 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }

  :global(.flowbite-tab-item::before) {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease-out;
  }

  :global(.flowbite-tab-item:hover::before) {
    left: 100%;
  }

  /* Hero section enhancements */
  .hero-search-input {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
</style>

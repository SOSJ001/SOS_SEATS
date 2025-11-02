<script lang="ts">
  // =====================================================
  // IMPORTS
  // =====================================================
  import EventCard from "$lib/components/EventCard.svelte";
  import SearchFilters from "$lib/components/SearchFilters.svelte";
  import { onMount } from "svelte";
  import { loadPublicEvents } from "$lib/supabase.js";

  // =====================================================
  // STATE VARIABLES
  // =====================================================

  // Search and filter functionality
  let searchQuery = ""; // Current search query for filtering events
  let selectedCategory = "All Events"; // Currently selected category filter
  let showFilters = false; // Toggle for showing/hiding filter options
  let pageLoaded = false; // Animation state for page load
  let cardsVisible = false; // Animation state for event cards
  let heroSearchQuery = ""; // Search query from hero section (currently disabled)
  let activeTab: "upcoming" | "resales" = "upcoming"; // Active tab for All Events section

  // Event data collections
  let allEvents: any[] = []; // All events loaded from database
  let featuredEvents: any[] = []; // Featured events (first 4 events)
  let upcomingEvents: any[] = []; // Upcoming events (first 6 events)
  let resaleEvents: any[] = []; // Resale events (events after the first 6)
  let loading = true; // Loading state for event data

  // =====================================================
  // REACTIVE STATEMENTS - EVENT FILTERING
  // =====================================================

  // Filter all events based on search query and selected category
  // Updates automatically when searchQuery or selectedCategory changes
  $: filteredEvents = (() => {
    const query = (searchQuery || "").toLowerCase().trim();
    const category = selectedCategory || "All Events";

    return allEvents.filter((event: any) => {
      // Check if event matches search query (name or venue)
      const eventName = (event.name || "").toLowerCase();
      const eventVenue = (event.venue || "").toLowerCase();
      const matchesSearch =
        query === "" || eventName.includes(query) || eventVenue.includes(query);

      // Check if event matches selected category
      const matchesCategory =
        category === "All Events" || event.category === category;

      // Return events that match both search and category
      return matchesSearch && matchesCategory;
    });
  })();

  // Filter featured events based on search query and selected category
  // Updates automatically when searchQuery, selectedCategory, or featuredEvents changes
  $: filteredFeaturedEvents = (() => {
    const query = (searchQuery || "").toLowerCase().trim();
    const category = selectedCategory || "All Events";

    return featuredEvents.filter((event: any) => {
      // Check if event matches search query (name or venue)
      const eventName = (event.name || "").toLowerCase();
      const eventVenue = (event.venue || "").toLowerCase();
      const matchesSearch =
        query === "" || eventName.includes(query) || eventVenue.includes(query);

      // Check if event matches selected category
      const matchesCategory =
        category === "All Events" || event.category === category;

      // Return events that match both search and category
      return matchesSearch && matchesCategory;
    });
  })();

  // =====================================================
  // FUNCTIONS
  // =====================================================

  // Handle search from hero section
  // Sets the main search query and scrolls to the main content area
  function handleHeroSearch() {
    searchQuery = heroSearchQuery;
    // Scroll to the main content
    document
      .getElementById("main-content")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // =====================================================
  // LIFECYCLE - ON MOUNT
  // =====================================================

  // Load events when component mounts
  onMount(async () => {
    try {
      // Load public events from database
      const events = await loadPublicEvents();

      // Process events: Ensure all events have the is_free_event property
      // Checks various formats for free events (0, "Free", "NLe 0", etc.)
      allEvents = (events || []).map((event: any) => {
        const price = event.price;
        const isFree =
          event.is_free_event ||
          price === 0 ||
          price === "Free" ||
          price === "0" ||
          price === "NLe 0" ||
          (typeof price === "string" &&
            (price.toLowerCase().includes("free") ||
              price.toLowerCase().includes("nle 0")));

        return {
          ...event,
          is_free_event: isFree,
        };
      });

      // Categorize events into different collections
      // Set featured events (first 4 events)
      featuredEvents = allEvents.slice(0, 4);

      // Set upcoming events (first 6 events)
      upcomingEvents = allEvents.slice(0, 6);

      // Set resale events (remaining events after first 6)
      resaleEvents = allEvents.slice(6);

      loading = false;
    } catch (error) {
      console.error("Error loading events:", error);
      loading = false;
    }

    // Trigger page load animation after a short delay
    setTimeout(() => {
      pageLoaded = true;
    }, 100);

    // Trigger card animations after page load
    setTimeout(() => {
      cardsVisible = true;
    }, 300);
  });
</script>

<!-- =====================================================
     MARKETPLACE PAGE
     Main page for browsing and discovering events
     ===================================================== -->
<div class="min-h-screen bg-gray-900 text-white">
  <!-- =====================================================
       HERO SECTION
       Full-height hero banner with background image and main heading
       ===================================================== -->
  <div class="relative h-[70vh] min-h-[600px] overflow-hidden">
    <!-- Background Image with Overlays -->
    <div class="absolute inset-0">
      <!-- Hero Background Image -->
      <img
        src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        alt="Event background"
        class="w-full h-full object-cover"
      />
      <!-- Dark overlay for better contrast -->
      <div class="absolute inset-0 bg-black/60"></div>
      <!-- Gradient overlay for better text readability -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"
      ></div>
    </div>

    <!-- Hero Content - Centered text and branding -->
    <div class="relative z-10 flex items-center justify-center h-full">
      <div class="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Main Heading: Large animated title -->
        <h1
          class="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 transition-all duration-1000 ease-out {pageLoaded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'}"
        >
          Discover Your Next Event
        </h1>

        <!-- Sub-heading: Descriptive text about the platform -->
        <p
          class="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 ease-out delay-200 {pageLoaded
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'}"
        >
          Find unforgettable experiences, from concerts and festivals to
          workshops and conferences, all powered by blockchain.
        </p>

        <!-- Search Bar (Currently Disabled/Commented Out) -->
        <!-- Hero search bar with backdrop blur effect -->
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

    <!-- Scroll Indicator: Animated arrow indicating scrollable content below -->
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

  <!-- =====================================================
       MAIN CONTENT AREA
       Container for search filters, featured events, and all events
       ===================================================== -->
  <div id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Search and Filters Section: Search bar and category filters -->
    <div
      class="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg transition-all duration-1000 ease-out delay-600 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <SearchFilters bind:searchQuery bind:selectedCategory />
    </div>

    <!-- =====================================================
         FEATURED EVENTS SECTION
         Displays the first 4 events as featured/promoted events
         ===================================================== -->
    <div
      class="mb-12 transition-all duration-1000 ease-out delay-800 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <!-- Section Title -->
      <h2
        class="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
      >
        Featured Events
      </h2>

      <!-- Loading State: Skeleton loaders for featured events -->
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
        <!-- Featured Events Grid: Responsive 4-column grid for desktop, 2 for tablet, 1 for mobile -->
      {:else if filteredFeaturedEvents.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each filteredFeaturedEvents as event, index}
            <!-- Event Card with staggered animation delay -->
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
        <!-- Empty State: Message when no featured events are available -->
      {:else}
        <div class="text-center py-12">
          <p class="text-gray-400 text-lg">
            No featured events available at the moment.
          </p>
        </div>
      {/if}
    </div>

    <!-- =====================================================
         ALL EVENTS SECTION
         Tabbed section displaying all events with filtering
         ===================================================== -->
    <div
      class="transition-all duration-1000 ease-out delay-1000 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <!-- Section Title and Filter Pills: "All Events" text with pill-shaped filter buttons -->
      <div
        class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8"
      >
        <!-- Section Title: Plain text on the left -->
        <h2 class="text-3xl md:text-4xl font-bold text-white">All Events</h2>

        <!-- Filter Pills: Two pill-shaped buttons next to the title -->
        <div class="flex items-center gap-3">
          <!-- Upcoming Button: Purple pill when active -->
          <button
            on:click={() => (activeTab = "upcoming")}
            class="px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 ease-out {activeTab ===
            'upcoming'
              ? 'bg-purple-600 shadow-lg transform scale-105'
              : 'bg-gray-700 hover:bg-gray-600'}"
          >
            Upcoming
          </button>

          <!-- Resales Button: Red/pink pill when active -->
          <button
            on:click={() => (activeTab = "resales")}
            class="px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 ease-out {activeTab ===
            'resales'
              ? 'bg-red-500 shadow-lg transform scale-105'
              : 'bg-gray-700 hover:bg-gray-600'}"
          >
            Resales
          </button>
        </div>
      </div>

      <!-- =====================================================
           UPCOMING CONTENT
           Displays all filtered events in a grid layout
           ===================================================== -->
      {#if activeTab === "upcoming"}
        <!-- Loading State: Skeleton loaders for upcoming events -->
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
          <!-- Events Grid: Responsive 4-column grid showing filtered events -->
        {:else if filteredEvents.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {#each filteredEvents as event, index}
              <!-- Event Card with staggered animation delay -->
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
          <!-- Empty State: Message when no events match the search/filter criteria -->
        {:else}
          <div class="text-center py-12">
            <p class="text-gray-400 text-lg">
              No events found matching your criteria.
            </p>
          </div>
        {/if}
      {/if}

      <!-- =====================================================
           RESALES CONTENT
           Displays resale events (events after the first 6)
           ===================================================== -->
      {#if activeTab === "resales"}
        <!-- Loading State: Skeleton loaders for resale events -->
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
          <!-- Resale Events Grid: Responsive 3-column grid for resale events -->
        {:else if resaleEvents.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each resaleEvents as event, index}
              <!-- Event Card with staggered animation delay -->
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
          <!-- Empty State: Message when no resale events are available -->
        {:else}
          <div class="text-center py-12">
            <p class="text-gray-400 text-lg">
              No resale events available at the moment.
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  /* =====================================================
     CUSTOM ANIMATIONS AND TRANSITIONS
     ===================================================== */

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

  /* =====================================================
     ENHANCED TAB ANIMATIONS
     Custom styles for Flowbite tabs with hover effects
     ===================================================== */

  /* Tab container transitions */
  :global(.flowbite-tabs) {
    transition: all 0.3s ease-out;
  }

  /* Individual tab item styling */
  :global(.flowbite-tab-item) {
    transition: all 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }

  /* Shimmer effect on tab hover */
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

  /* Animate shimmer effect on hover */
  :global(.flowbite-tab-item:hover::before) {
    left: 100%;
  }

  /* =====================================================
     HERO SECTION ENHANCEMENTS
     Backdrop blur effects for hero search input
     (Currently unused - reserved for future hero search feature)
     ===================================================== */
  /* .hero-search-input {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  } */
</style>

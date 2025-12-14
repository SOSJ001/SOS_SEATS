<!--
  Marketplace Page
  ================
  
  Main landing page for browsing and discovering events in the SOS SEATS platform.
  
  Features:
  - Hero section with animated banner and call-to-action
  - Search and filter functionality (by name, venue, category)
  - Featured events section (first 4 events)
  - Tabbed "All Events" section with:
    * Upcoming tab (all filtered events)
    * Resales tab (events after the first 6)
  - Responsive grid layouts for event cards
  - Loading states with skeleton loaders
  - Smooth animations and transitions
  
  Route: /marketplace
-->

<script lang="ts">
  // ============================================================================
  // IMPORTS
  // ============================================================================

  // UI Components
  import EventCard from "$lib/components/EventCard.svelte";
  import SearchFilters from "$lib/components/SearchFilters.svelte";

  // Svelte lifecycle
  import { onMount } from "svelte";

  // Database functions
  import { loadPublicEvents } from "$lib/supabase.js";

  // ============================================================================
  // STATE VARIABLES - Search & Filter
  // ============================================================================

  // Current search query for filtering events by name or venue
  let searchQuery = "";

  // Currently selected category filter (defaults to "All Events")
  let selectedCategory = "All Events";

  // Toggle for showing/hiding filter options (currently unused)
  let showFilters = false;

  // Search query from hero section (currently disabled - hero search is commented out)
  let heroSearchQuery = "";

  // ============================================================================
  // STATE VARIABLES - UI Animation States
  // ============================================================================

  // Controls page load animation (fade in, slide up)
  let pageLoaded = false;

  // Controls event card animations (staggered fade in)
  let cardsVisible = false;

  // Active tab in "All Events" section ("upcoming" or "resales")
  let activeTab: "upcoming" | "resales" = "upcoming";

  // ============================================================================
  // STATE VARIABLES - Event Data Collections
  // ============================================================================

  // All events loaded from database (raw data)
  let allEvents: any[] = [];

  // Featured events (first 4 events from allEvents)
  // Displayed prominently at the top of the page
  let featuredEvents: any[] = [];

  // Upcoming events (first 6 events from allEvents)
  // Shown in the "Upcoming" tab
  let upcomingEvents: any[] = [];

  // Resale events (events after the first 6)
  // Shown in the "Resales" tab
  let resaleEvents: any[] = [];

  // Loading state for event data fetch
  let loading = true;

  // ============================================================================
  // REACTIVE STATEMENTS - Event Filtering
  // ============================================================================

  /**
   * Filtered events for the "All Events" section
   *
   * Reactively filters allEvents based on:
   * 1. Search query (matches event name or venue)
   * 2. Selected category filter
   *
   * Updates automatically when:
   * - searchQuery changes
   * - selectedCategory changes
   * - allEvents changes
   *
   * Used in the "Upcoming" tab to display filtered results.
   */
  $: filteredEvents = (() => {
    // Normalize search query (lowercase, trimmed)
    const query = (searchQuery || "").toLowerCase().trim();
    const category = selectedCategory || "All Events";

    return allEvents.filter((event: any) => {
      // Search matching: Check event name or venue
      const eventName = (event.name || "").toLowerCase();
      const eventVenue = (event.venue || "").toLowerCase();
      const matchesSearch =
        query === "" || eventName.includes(query) || eventVenue.includes(query);

      // Category matching: Check if event category matches selected filter
      const matchesCategory =
        category === "All Events" || event.category === category;

      // Event must match both search AND category to be included
      return matchesSearch && matchesCategory;
    });
  })();

  /**
   * Filtered featured events
   *
   * Reactively filters featuredEvents based on:
   * 1. Search query (matches event name or venue)
   * 2. Selected category filter
   *
   * Updates automatically when:
   * - searchQuery changes
   * - selectedCategory changes
   * - featuredEvents changes
   *
   * Used in the "Featured Events" section at the top of the page.
   */
  $: filteredFeaturedEvents = (() => {
    // Normalize search query (lowercase, trimmed)
    const query = (searchQuery || "").toLowerCase().trim();
    const category = selectedCategory || "All Events";

    return featuredEvents.filter((event: any) => {
      // Search matching: Check event name or venue
      const eventName = (event.name || "").toLowerCase();
      const eventVenue = (event.venue || "").toLowerCase();
      const matchesSearch =
        query === "" || eventName.includes(query) || eventVenue.includes(query);

      // Category matching: Check if event category matches selected filter
      const matchesCategory =
        category === "All Events" || event.category === category;

      // Event must match both search AND category to be included
      return matchesSearch && matchesCategory;
    });
  })();

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  /**
   * Handles search from hero section
   *
   * Currently disabled (hero search bar is commented out).
   * When enabled, this function:
   * 1. Sets the main search query from hero input
   * 2. Smoothly scrolls to the main content area
   *
   * This allows users to search directly from the hero section
   * and automatically see results.
   */
  function handleHeroSearch() {
    searchQuery = heroSearchQuery;
    // Smooth scroll to main content area to show filtered results
    document
      .getElementById("main-content")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // ============================================================================
  // LIFECYCLE - Component Initialization
  // ============================================================================

  /**
   * Component mount handler
   *
   * Runs when the component is first mounted to the DOM.
   *
   * Responsibilities:
   * 1. Load public events from Supabase database
   * 2. Process events to determine free event status
   * 3. Categorize events into collections (featured, upcoming, resales)
   * 4. Trigger page load animations
   * 5. Trigger card animations after page loads
   */
  onMount(async () => {
    try {
      // ========================================================================
      // Load Events from Database
      // ========================================================================

      // Load all public events from Supabase
      const events = await loadPublicEvents();

      // ========================================================================
      // Process Events - Determine Free Event Status
      // ========================================================================

      // Process events: Ensure all events have the is_free_event property
      // Handles various price formats that indicate a free event:
      // - Explicit is_free_event flag
      // - Price === 0 (number)
      // - Price === "Free" (string)
      // - Price === "0" or "NLe 0" (string)
      // - Price string containing "free" or "nle 0" (case-insensitive)
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

      // ========================================================================
      // Categorize Events into Collections
      // ========================================================================

      // Featured events: First 4 events (displayed prominently at top)
      featuredEvents = allEvents.slice(0, 4);

      // Upcoming events: First 6 events (shown in "Upcoming" tab)
      upcomingEvents = allEvents.slice(0, 6);

      // Resale events: Remaining events after first 6 (shown in "Resales" tab)
      resaleEvents = allEvents.slice(6);

      loading = false;
    } catch (error) {
      console.error("Error loading events:", error);
      loading = false;
    }

    // ========================================================================
    // Trigger Animations
    // ========================================================================

    // Trigger page load animation after a short delay (100ms)
    // This allows the DOM to render before animations start
    setTimeout(() => {
      pageLoaded = true;
    }, 100);

    // Trigger card animations after page load animation completes (300ms delay)
    // Creates a staggered effect where cards fade in one by one
    setTimeout(() => {
      cardsVisible = true;
    }, 300);
  });
</script>

<svelte:head>
  <title>Marketplace - SOS SEATS</title>
</svelte:head>

<!-- ============================================================================
     TEMPLATE - Page Structure
     ============================================================================
     
     The page is structured as follows:
     1. Hero section with animated banner and call-to-action
     2. Main content area:
        - Search and filter section
        - Featured events section (first 4 events)
        - All events section with tabs:
          * Upcoming tab (all filtered events)
          * Resales tab (events after first 6)
     3. Loading states with skeleton loaders
     4. Empty states for when no events match filters
-->

<div class="min-h-screen bg-gray-900 text-white">
  <!-- ============================================================================
       HERO SECTION
       ============================================================================
       
       Full-height hero banner (70vh, minimum 600px) featuring:
       - Background image with dark and gradient overlays
       - Animated heading and subheading
       - Scroll indicator (animated arrow)
       - Hero search bar (currently commented out/disabled)
  -->
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

  <!-- ============================================================================
       MAIN CONTENT AREA
       ============================================================================
       
       Container for all main content sections:
       - Search and filter controls
       - Featured events grid
       - All events tabbed section
  -->
  <div id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- ========================================================================
         Search and Filters Section
         ========================================================================
         
         SearchFilters component provides:
         - Search input (filters by event name or venue)
         - Category dropdown (filters by event category)
         - Two-way binding with searchQuery and selectedCategory
    -->
    <div
      class="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg transition-all duration-1000 ease-out delay-600 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <SearchFilters bind:searchQuery bind:selectedCategory />
    </div>

    <!-- ============================================================================
         FEATURED EVENTS SECTION
         ============================================================================
         
         Displays the first 4 events from allEvents as featured/promoted events.
         These events are shown prominently at the top of the page.
         
         Features:
         - Responsive grid: 4 columns (desktop), 2 columns (tablet), 1 column (mobile)
         - Loading state with skeleton loaders
         - Staggered card animations (cards fade in one by one)
         - Empty state when no featured events match filters
    -->
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

    <!-- ============================================================================
         ALL EVENTS SECTION
         ============================================================================
         
         Tabbed section displaying all events with filtering capabilities.
         
         Structure:
         - Section title with tab pills (Upcoming / Resales)
         - Tab content that switches based on activeTab state
         - Each tab shows filtered events in a responsive grid
    -->
    <div
      class="transition-all duration-1000 ease-out delay-1000 {pageLoaded
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-8'}"
    >
      <!-- ========================================================================
           Section Header - Title and Tab Pills
           ========================================================================
           
           Displays "All Events" title with two tab buttons:
           - Upcoming: Shows all filtered events (purple when active)
           - Resales: Shows resale events (red when active)
      -->
      <div
        class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8"
      >
        <!-- Section Title -->
        <h2 class="text-3xl md:text-4xl font-bold text-white">All Events</h2>

        <!-- Tab Pills: Two pill-shaped buttons for switching between views -->
        <div class="flex items-center gap-3">
          <!-- Upcoming Tab Button
               - Purple background when active
               - Scales up and shows shadow when active
               - Gray background when inactive
          -->
          <button
            on:click={() => (activeTab = "upcoming")}
            class="px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 ease-out {activeTab ===
            'upcoming'
              ? 'bg-purple-600 shadow-lg transform scale-105'
              : 'bg-gray-700 hover:bg-gray-600'}"
          >
            Upcoming
          </button>

          <!-- Resales Tab Button
               - Red background when active
               - Scales up and shows shadow when active
               - Gray background when inactive
          -->
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

      <!-- ========================================================================
           UPCOMING TAB CONTENT
           ========================================================================
           
           Displays all filtered events (filteredEvents) in a responsive grid.
           
           Features:
           - Loading state: 6 skeleton loaders in 3-column grid
           - Events grid: 4 columns (desktop), 1 column (mobile)
           - Staggered animations: Cards fade in with 100ms delay between each
           - Empty state: Message when no events match search/filter criteria
           - Button text: "Get Free Ticket" for free events, "View Details" for paid
      -->
      {#if activeTab === "upcoming"}
        <!-- Loading State: Skeleton loaders while events are being fetched -->
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
          <!-- Events Grid: Shows filteredEvents in responsive 4-column grid -->
        {:else if filteredEvents.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {#each filteredEvents as event, index}
              <!-- Event Card with staggered animation (100ms delay per card) -->
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
          <!-- Empty State: Shown when no events match search/filter criteria -->
        {:else}
          <div class="text-center py-12">
            <p class="text-gray-400 text-lg">
              No events found matching your criteria.
            </p>
          </div>
        {/if}
      {/if}

      <!-- ========================================================================
           RESALES TAB CONTENT
           ========================================================================
           
           Displays resale events (resaleEvents - events after the first 6).
           
           Features:
           - Loading state: 3 skeleton loaders in 3-column grid
           - Events grid: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
           - Staggered animations: Cards fade in with 100ms delay between each
           - Empty state: Message when no resale events are available
           - Button text: "Get Free Ticket" for free events, "View Details" for paid
      -->
      {#if activeTab === "resales"}
        <!-- Loading State: Skeleton loaders while events are being fetched -->
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
          <!-- Resale Events Grid: Shows resaleEvents in responsive 3-column grid -->
        {:else if resaleEvents.length > 0}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each resaleEvents as event, index}
              <!-- Event Card with staggered animation (100ms delay per card) -->
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
          <!-- Empty State: Shown when no resale events are available -->
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

<!-- ============================================================================
     STYLES
     ============================================================================ -->

<style>
  /* ============================================================================
     CUSTOM ANIMATIONS AND TRANSITIONS
     ============================================================================
     
     Global utility classes for smooth page transitions and animations.
     These classes are used throughout the template for consistent animations.
  */

  /* Global transition utility - applies transitions to all properties */
  :global(.transition-all) {
    transition-property: all;
  }

  /* Global duration utility - 700ms transition duration */
  :global(.duration-700) {
    transition-duration: 700ms;
  }

  /* Global easing utility - ease-out timing function */
  :global(.ease-out) {
    transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }

  /* ============================================================================
     ENHANCED TAB ANIMATIONS
     ============================================================================
     
     Custom styles for Flowbite tabs with hover effects.
     These styles add shimmer/shine effects on tab hover.
     
     Note: Currently not used in this component, but reserved for potential
     future tab component integration.
  */

  /* Tab container - smooth transitions for all properties */
  :global(.flowbite-tabs) {
    transition: all 0.3s ease-out;
  }

  /* Individual tab item - positioned relative for shimmer effect */
  :global(.flowbite-tab-item) {
    transition: all 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }

  /* Shimmer effect pseudo-element - creates a sliding shine effect */
  :global(.flowbite-tab-item::before) {
    content: "";
    position: absolute;
    top: 0;
    left: -100%; /* Start off-screen to the left */
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

  /* Animate shimmer effect on hover - slides from left to right */
  :global(.flowbite-tab-item:hover::before) {
    left: 100%; /* End off-screen to the right */
  }

  /* ============================================================================
     HERO SECTION ENHANCEMENTS
     ============================================================================
     
     Backdrop blur effects for hero search input.
     
     Currently unused - reserved for future hero search feature.
     When hero search is enabled, these styles will provide a glassmorphism
     effect to the search input.
  */
  /* .hero-search-input {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  } */
</style>

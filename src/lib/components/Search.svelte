<script>
  let date;
  let eventName = "";
  let venue = "";
  let city = "";
  
  const categories = [
    { name: "Movies", icon: "🎬" },
    { name: "Conferences", icon: "🎤" },
    { name: "Sports", icon: "⚽" },
    { name: "Concerts", icon: "🎵" },
    { name: "More Events", icon: "✨" }
  ];
  
  let selectedCategory = "";
  
  const handleSearch = () => {
    console.log({
      eventName,
      venue,
      city,
      date: date?.value,
      category: selectedCategory
    });
  };
</script>

<div id="search" class="relative -mt-20 z-20 px-4">
  <div class="max-w-6xl mx-auto">
    <!-- Enhanced search container with glass effect -->
    <div class="glass-effect p-8 shadow-2xl">
      <!-- Header section -->
      <div class="text-center mb-8">
        <h2 class="font-display text-3xl md:text-4xl font-bold text-white mb-4">
          Welcome to <span class="text-brand-yellow">S.O.S SEATS</span>
        </h2>
        <p class="text-gray-300 text-lg font-body">
          What are you looking for today?
        </p>
      </div>
      
      <!-- Category tags -->
      <div class="flex flex-wrap justify-center gap-3 mb-8">
        {#each categories as category}
          <button 
            class="category-tag {selectedCategory === category.name ? 'bg-brand-yellow text-brand-dark' : ''}"
            on:click={() => selectedCategory = selectedCategory === category.name ? '' : category.name}
          >
            <span class="mr-2">{category.icon}</span>
            {category.name}
          </button>
        {/each}
      </div>
      
      <!-- Divider -->
      <div class="flex items-center justify-center mb-8">
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-brand-yellow to-transparent"></div>
        <div class="px-4 text-brand-yellow font-medium">Search Events</div>
        <div class="flex-1 h-px bg-gradient-to-r from-transparent via-brand-yellow to-transparent"></div>
      </div>
      
      <!-- Search form -->
      <form on:submit|preventDefault={handleSearch} class="space-y-6">
        <!-- Main search input -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            bind:value={eventName}
            class="input-field w-full pl-12 text-lg"
            placeholder="Search for events, artists, venues..."
          />
        </div>
        
        <!-- Filter options -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Venue selector -->
          <div class="space-y-2">
            <label for="venue" class="block text-sm font-medium text-gray-300">
              Venue
            </label>
            <div class="relative">
              <select
                id="venue"
                bind:value={venue}
                class="input-field w-full appearance-none pr-10"
              >
                <option value="">Select Venue</option>
                <option value="venue1">Madison Square Garden</option>
                <option value="venue2">Wembley Stadium</option>
                <option value="venue3">Sydney Opera House</option>
                <option value="venue4">Hollywood Bowl</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Date picker -->
          <div class="space-y-2">
            <label for="date" class="block text-sm font-medium text-gray-300">
              Date
            </label>
            <input
              bind:this={date}
              type="date"
              id="date"
              class="input-field w-full"
            />
          </div>
          
          <!-- City selector -->
          <div class="space-y-2">
            <label for="city" class="block text-sm font-medium text-gray-300">
              City
            </label>
            <div class="relative">
              <select
                id="city"
                bind:value={city}
                class="input-field w-full appearance-none pr-10"
              >
                <option value="">Select City</option>
                <option value="new-york">New York</option>
                <option value="london">London</option>
                <option value="sydney">Sydney</option>
                <option value="los-angeles">Los Angeles</option>
                <option value="tokyo">Tokyo</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Search button -->
        <div class="flex justify-center pt-4">
          <button
            type="submit"
            class="btn-primary text-xl px-12 py-4 group"
          >
            <span class="flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Search Events
              <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          </button>
        </div>
      </form>
      
      <!-- Quick suggestions -->
      <div class="mt-8 text-center">
        <p class="text-gray-400 text-sm mb-3">Popular searches:</p>
        <div class="flex flex-wrap justify-center gap-2">
          {#each ["Concert tickets", "Sports events", "Theater shows", "Comedy nights"] as suggestion}
            <button 
              class="text-xs bg-brand-dark-tertiary hover:bg-brand-yellow hover:text-brand-dark text-gray-300 px-3 py-1 rounded-full transition-all duration-200"
              on:click={() => eventName = suggestion}
            >
              {suggestion}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Alkatra:wght@400;500;600;700&display=swap");
  
  /* Custom scrollbar for select elements */
  select::-webkit-scrollbar {
    width: 8px;
  }
  
  select::-webkit-scrollbar-track {
    background: #2A2A2A;
  }
  
  select::-webkit-scrollbar-thumb {
    background: #FFC107;
    border-radius: 4px;
  }
</style>
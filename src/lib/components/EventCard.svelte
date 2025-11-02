<script>
  import { goto } from "$app/navigation";

  export let event = {
    id: 1,
    name: "Event Name",
    date: "2024-01-01",
    venue: "Venue Name",
    image: "https://placehold.co/600x400",
    price: "NLe 150",
    category: "Music",
    is_free_event: false,
  };

  export let showBuyButton = true;
  export let buttonText = "Buy Now";

  let paymentOptions = false;
  let isHovered = false;

  $: if (event) {
  }
</script>

<div
  class="group bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 relative"
  role="article"
  aria-label="Event card for {event.name}"
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
>
  <!-- Image container with blurred cover photo and overlay image -->
  <div class="relative min-h-[400px] sm:min-h-[450px] overflow-hidden">
    <!-- Blurred Cover Photo Background -->
    <img
      src={event.image}
      alt={event.name}
      class="absolute inset-0 w-full h-full object-cover blur-sm sm:blur-md transition-transform duration-700 ease-out {isHovered
        ? 'scale-110'
        : 'scale-100'}"
    />

    <!-- Gradient overlay for better text readability -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
    ></div>

    <!-- Category Badge - Top Left -->
    <div class="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
      <span
        class="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg"
      >
        {event.category}
      </span>
    </div>

    <!-- Centered Overlay Image -->
    <div
      class="absolute top-0 left-0 right-0 flex items-center justify-center p-4 sm:p-6 pt-8 sm:pt-12"
    >
      <img
        src={event.image}
        alt={event.name}
        class="max-w-full max-h-[200px] sm:max-h-[240px] w-auto h-auto rounded-lg border-2 sm:border-4 border-white/30 shadow-2xl object-contain transition-transform duration-300 {isHovered
          ? 'scale-105'
          : 'scale-100'}"
      />
    </div>

    <!-- Content Below Overlay Image -->
    <div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
      <!-- Event Name -->
      <h3
        class="text-lg sm:text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-300 line-clamp-2"
      >
        {event.name}
      </h3>

      <!-- Event Date: Displays the event date with calendar icon -->
      <p class="text-white/90 text-sm mb-2 flex items-center gap-2">
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
        {event.date}
      </p>

      <!-- Event Venue: Displays the event venue/location with location pin icon -->
      <p class="text-white/90 text-sm mb-3 flex items-center gap-2">
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          ></path>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
        {event.venue}
      </p>

      <!-- Event Action Buttons and Price -->
      <div class="flex items-center justify-between">
        <!-- Price Badge: Displays event price or "Free" for free events -->
        <span
          class="px-3 py-1.5 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm text-white text-sm sm:text-base font-bold rounded-full border border-white/30 shadow-lg"
        >
          {event.is_free_event ? "Free" : event.price}
        </span>

        {#if !event.is_free_event && showBuyButton}
          <!-- Paid Event Button: Shows "Buy Now" or "View Details" depending on buttonText prop -->
          <!-- If buttonText is "View Details", navigates to event details page -->
          <!-- Otherwise, opens payment options modal -->
          <button
            on:click={() => {
              if (buttonText === "View Details") {
                goto(`/marketplace/eventDetails/${event.id}`);
              } else {
                paymentOptions = true;
              }
            }}
            class="relative overflow-hidden px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg hover:from-blue-600 hover:to-purple-700 group/btn"
          >
            <!-- Button shine effect -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
            ></div>
            <span class="relative z-10">{buttonText}</span>
          </button>
        {:else if event.is_free_event}
          <!-- Free Event Button: Navigates directly to event details page -->
          <button
            on:click={() => {
              goto(`/marketplace/eventDetails/${event.id}`);
            }}
            class="relative overflow-hidden px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg hover:from-green-600 hover:to-emerald-700 group/btn"
          >
            <!-- Button shine effect -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
            ></div>
            <span class="relative z-10">Get Free Ticket</span>
          </button>
        {:else}
          <!-- Default Button: Fallback button that navigates to event details page -->
          <!-- Used when event is not free and showBuyButton is false -->
          <button
            on:click={() => {
              goto(`/marketplace/eventDetails/${event.id}`);
            }}
            class="relative overflow-hidden px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg hover:from-blue-600 hover:to-purple-700 group/btn"
          >
            <!-- Button shine effect -->
            <div
              class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
            ></div>
            <span class="relative z-10">View Details</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Subtle border glow on hover -->
  <div
    class="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-500/30 transition-colors duration-500 pointer-events-none"
  ></div>
</div>

<style>
  /* Enhanced card animations */
  .group:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  /* Smooth image zoom */
  img {
    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Button pulse effect */
  button:hover {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
  }
</style>

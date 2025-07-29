<script>
  export let event = {
    id: 1,
    name: "Event Name",
    date: "2024-01-01",
    venue: "Venue Name",
    image: "https://placehold.co/600x400",
    price: "NLe 150",
    category: "Music",
  };

  export let showBuyButton = true;
  export let buttonText = "Buy Now";

  let paymentOptions = false;
  let isHovered = false;
</script>

<div
  class="group bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-2 relative"
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
>
  <!-- Image container with zoom effect -->
  <div class="relative overflow-hidden">
    <img
      src={event.image}
      alt={event.name}
      class="w-full h-48 object-cover transition-transform duration-700 ease-out {isHovered
        ? 'scale-110'
        : 'scale-100'}"
    />
    <!-- Gradient overlay on hover -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    ></div>

    <!-- Category badge -->
    <div class="absolute top-3 left-3">
      <span
        class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg"
      >
        {event.category}
      </span>
    </div>

    <!-- Price badge -->
    <div class="absolute top-3 right-3">
      <span
        class="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm font-bold rounded-full"
      >
        {event.price}
      </span>
    </div>
  </div>

  <div class="p-6">
    <h3
      class="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors duration-300"
    >
      {event.name}
    </h3>
    <p class="text-gray-400 text-sm mb-4 flex items-center gap-2">
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
    <p class="text-gray-400 text-sm mb-6 flex items-center gap-2">
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

    <div class="flex items-center justify-between">
      <span
        class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
      >
        {event.price}
      </span>
      <button
        on:click={() => {
          if (buttonText === "View Details") {
            window.location.href = `/marketplace/eventDetails/${event.id}`;
          } else {
            paymentOptions = true;
          }
        }}
        class="relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg hover:from-blue-600 hover:to-purple-700 group/btn"
      >
        <!-- Button shine effect -->
        <div
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
        ></div>
        <span class="relative z-10">{buttonText}</span>
      </button>
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

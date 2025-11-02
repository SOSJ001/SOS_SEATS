<script lang="ts">
  export let event: {
    name: string;
    date: string;
    venue: string;
    image: string;
  } = {
    name: "Event Name",
    date: "2024-01-01",
    venue: "Venue Name",
    image: "https://placehold.co/1200x600",
  };
</script>

<!-- Event Banner with Cover Photo and Overlay Image -->
<div
  class="relative h-96 sm:h-80 md:h-64 lg:h-72 xl:h-80 rounded-lg overflow-hidden"
>
  <!-- Cover Photo Background with Blur -->
  <img
    src={event.image}
    alt={event.name}
    class="w-full h-full object-cover blur-sm sm:blur-md"
  />
  <div
    class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
  ></div>

  <!-- Overlay Content Container - Mobile: Centered and Stacked -->
  <div
    class="absolute bottom-0 md:left-20 left-0 right-0 flex flex-col items-center justify-center gap-3 sm:gap-4 md:flex-row md:items-end md:justify-start pb-4 sm:pb-4 md:pb-6 px-3 sm:px-4 md:px-6"
  >
    <!-- Smaller Event Image (Overlay) - Fully Visible, Centered on Mobile -->
    <div
      class="relative flex-shrink-0 flex items-center justify-center w-64 h-64 sm:w-56 sm:h-56 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56"
    >
      <img
        src={event.image}
        alt={event.name}
        class="max-w-full max-h-full w-auto h-auto rounded-lg border-2 sm:border-2 md:border-4 border-white/20 shadow-xl sm:shadow-2xl object-contain"
      />
    </div>

    <!-- Event Title and Date - Below Image on Mobile, Next to Image on Desktop -->
    <div
      class="flex-1 min-w-0 text-center md:text-left pb-2 md:pb-2 text-white"
    >
      <h1
        class="text-2xl sm:text-3xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 line-clamp-2"
      >
        {event.name}
      </h1>
      <p
        class="text-sm sm:text-base md:text-sm lg:text-base xl:text-lg text-gray-200 line-clamp-1"
      >
        {event.date}
      </p>
    </div>
  </div>
</div>

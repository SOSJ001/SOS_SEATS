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

<div class="relative h-[50vh] min-h-[400px] overflow-hidden">
  <!-- Background Image -->
  <div class="absolute inset-0">
    <img
      src={event.image}
      alt={event.name}
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
      <!-- Main Event Title -->
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
        {event.name}
      </h1>

      <!-- Event Subtitle with Date & Location -->
      <p class="text-xl md:text-2xl text-gray-200">
        {event.date} • {event.venue}
      </p>
    </div>
  </div>
</div>

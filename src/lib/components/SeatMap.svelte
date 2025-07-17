<script lang="ts">
  export let selectedSeat: string | null = null;
  export let onSeatClick: (seatId: string) => void = () => {};

  // Sample seat data - in real app this would come from props
  const rows = ["A", "B", "C"];
  const columns = Array.from({ length: 10 }, (_, i) => i + 1);

  // Sample seat states - in real app this would come from database
  const seatStates = {
    A1: "vip",
    A2: "vip",
    A4: "vip",
    A8: "vip",
    A9: "vip",
    A10: "vip",
    B1: "vip",
    B3: "vip",
    B4: "vip",
    A5: "selected",
    A6: "selected",
    B5: "selected",
    B7: "selected",
    B10: "selected",
    A3: "booked",
    A7: "booked",
    B2: "booked",
    B6: "booked",
    B8: "booked",
    B9: "booked",
  };

  // All C seats are booked/standard
  rows.forEach((row) => {
    columns.forEach((col) => {
      const seatId = `${row}${col}`;
      if (row === "C" && !seatStates[seatId]) {
        seatStates[seatId] = "booked";
      }
    });
  });

  function getSeatClass(seatId: string): string {
    const state = seatStates[seatId] || "available";
    const isSelected = selectedSeat === seatId;

    const baseClasses =
      "w-12 h-12 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 cursor-pointer border-2";

    switch (state) {
      case "vip":
        return `${baseClasses} bg-yellow-400 text-gray-900 border-yellow-500 hover:bg-yellow-300 ${isSelected ? "ring-4 ring-yellow-300" : ""}`;
      case "selected":
        return `${baseClasses} bg-cyan-400 text-gray-900 border-cyan-500 hover:bg-cyan-300 ${isSelected ? "ring-4 ring-cyan-300" : ""}`;
      case "booked":
        return `${baseClasses} bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed opacity-50`;
      default:
        return `${baseClasses} bg-gray-700 text-white border-gray-600 hover:bg-gray-600 ${isSelected ? "ring-4 ring-gray-400" : ""}`;
    }
  }

  function handleSeatClick(seatId: string) {
    const state = seatStates[seatId];
    if (state !== "booked") {
      onSeatClick(seatId);
    }
  }
</script>

<div class="bg-gray-800 rounded-lg p-6">
  <h2 class="text-xl font-bold text-white mb-6">Seating Map</h2>

  <!-- Stage -->
  <div class="mb-8">
    <div
      class="w-full h-16 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-lg flex items-center justify-center shadow-lg"
    >
      <span class="text-gray-900 font-bold text-lg">STAGE</span>
    </div>
  </div>

  <!-- Seating Grid -->
  <div class="space-y-4 overflow-x-auto">
    {#each rows as row}
      <div class="flex items-center space-x-4">
        <!-- Row Label -->
        <div class="w-8 text-center">
          <span class="text-gray-400 font-semibold">{row}</span>
        </div>

        <!-- Seats -->
        <div class="flex space-x-2 ">
          {#each columns as col}
            {@const seatId = `${row}${col}`}
            <button
              class={getSeatClass(seatId)}
              on:click={() => handleSeatClick(seatId)}
              disabled={seatStates[seatId] === "booked"}
            >
              {seatId}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Legend -->
  <div class="mt-8 pt-6 border-t border-gray-700">
    <h3 class="text-sm font-semibold text-gray-400 mb-3">Legend</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
        <span class="text-sm text-gray-400">Available</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-gray-600 rounded"></div>
        <span class="text-sm text-gray-400">Booked</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-cyan-400 rounded"></div>
        <span class="text-sm text-gray-400">Selected</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
        <span class="text-sm text-gray-400">Standard Tier</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
        <span class="text-sm text-gray-400">Premium Tier</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-yellow-400 rounded"></div>
        <span class="text-sm text-gray-400">VIP Tier</span>
      </div>
    </div>
  </div>
</div>

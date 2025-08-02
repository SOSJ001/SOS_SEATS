<script lang="ts">
  export let selectedSeat: any = null;

  // Sample seat data - in real app this would come from database
  const seatData = {
    A5: {
      id: "A5",
      status: "Selected",
      pricingTier: "VIP",
      price: 150.0,
      section: "Front Row",
      assignedGuest: "N/A",
    },
  };

  function getSeatInfo() {
    if (!selectedSeat) return null;
    return (
      seatData[selectedSeat] || {
        id: selectedSeat,
        status: "Available",
        pricingTier: "Standard",
        price: 50.0,
        section: "General",
        assignedGuest: "N/A",
      }
    );
  }

  function handleBookSeat() {
    // Handle booking logic
    }

  function handleAssignGuest() {
    // Handle guest assignment logic
    }

  function handleChangeTier() {
    // Handle tier change logic
    }

  function handleCancelBooking() {
    // Handle booking cancellation logic
    }
</script>

<div class="bg-gray-800 rounded-lg p-6">
  <h2 class="text-xl font-bold text-white mb-6">Selected Seat Details</h2>

  {#if selectedSeat && getSeatInfo()}
    {@const seatInfo = getSeatInfo()}

    <!-- Seat Information -->
    <div class="space-y-4 mb-6">
      <div class="flex justify-between items-center">
        <span class="text-gray-400">Seat ID:</span>
        <span class="text-white font-semibold">{seatInfo.id}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-400">Status:</span>
        <span class="text-white font-semibold">{seatInfo.status}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-400">Pricing Tier:</span>
        <span class="text-white font-semibold">{seatInfo.pricingTier}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-400">Price:</span>
        <span class="text-white font-semibold"
          >${seatInfo.price.toFixed(2)}</span
        >
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-400">Section:</span>
        <span class="text-white font-semibold">{seatInfo.section}</span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-gray-400">Assigned Guest:</span>
        <span class="text-white font-semibold">{seatInfo.assignedGuest}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3">
      <button
        on:click={handleBookSeat}
        class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Book Seat</span>
      </button>

      <button
        on:click={handleAssignGuest}
        class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"
          />
        </svg>
        <span>Assign Guest</span>
      </button>

      <button
        on:click={handleChangeTier}
        class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Change Tier</span>
      </button>

      <button
        on:click={handleCancelBooking}
        class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
        <span>Cancel Booking</span>
      </button>
    </div>
  {:else}
    <div class="text-center py-8">
      <svg
        class="w-16 h-16 mx-auto text-gray-600 mb-4"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <p class="text-gray-400">Select a seat to view details</p>
    </div>
  {/if}
</div>

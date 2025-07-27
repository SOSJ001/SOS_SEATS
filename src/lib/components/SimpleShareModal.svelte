<script>
  export let event = {};
  export let isOpen = false;

  function closeModal() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
  >
    <div class="bg-gray-900 rounded-xl p-8 max-w-md w-full">
      <h2 class="text-2xl font-bold text-white mb-4">Share Event</h2>
      <p class="text-white mb-4">Sharing: {event.title}</p>
      <button
        on:click={closeModal}
        class="px-4 py-2 bg-teal-500 text-white rounded-lg"
      >
        Close
      </button>
    </div>
  </div>
{/if}

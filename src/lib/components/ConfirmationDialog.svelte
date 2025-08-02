<script>
  import { createEventDispatcher } from "svelte";
  import { fade, fly } from "svelte/transition";

  export let show = false;
  export let title = "Confirm Action";
  export let message = "Are you sure you want to proceed?";
  export let confirmText = "Confirm";
  export let cancelText = "Cancel";
  export let confirmVariant = "danger"; // 'danger', 'success', 'warning'
  export let loading = false;

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch("confirm");
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      handleCancel();
    }
  }

  $: confirmButtonClasses =
    {
      danger: "bg-red-600 hover:bg-red-700",
      success: "bg-green-600 hover:bg-green-700",
      warning: "bg-yellow-600 hover:bg-yellow-700",
    }[confirmVariant] || "bg-red-600 hover:bg-red-700";
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    transition:fade
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md"
      transition:fly={{ y: 20 }}
    >
      <!-- Header -->
      <div class="mb-4">
        <h3 class="text-xl font-semibold text-white">{title}</h3>
      </div>

      <!-- Content -->
      <div class="mb-6">
        <p class="text-gray-300">{message}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <button
          on:click={handleCancel}
          disabled={loading}
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          on:click={handleConfirm}
          disabled={loading}
          class="px-4 py-2 {confirmButtonClasses} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if loading}
            <svg
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          {/if}
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

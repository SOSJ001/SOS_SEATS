<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";

  export let show = false;
  export let title = "Confirm Action";
  export let message = "Are you sure you want to proceed?";
  export let confirmText = "Confirm";
  export let cancelText = "Cancel";
  export let confirmVariant: "danger" | "success" | "warning" = "danger";
  export let loading = false;

  const dispatch = createEventDispatcher();
  let container: HTMLDivElement | null = null;

  // Portal action to append modal to body
  function portal(node: HTMLElement): { destroy: () => void } | void {
    if (typeof document === "undefined") return;

    const target = document.body;
    target.appendChild(node);

    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }

  // Lock body scroll when modal is open
  $: if (typeof document !== "undefined") {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  // Cleanup on component destroy
  onMount(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  });

  function handleConfirm() {
    dispatch("confirm");
  }

  function handleCancel() {
    dispatch("cancel");
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
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
    bind:this={container}
    use:portal
    class="modal-backdrop"
    style="position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 9999 !important; background-color: rgba(0, 0, 0, 0.5) !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 1rem !important;"
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
        on:click|stopPropagation
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

<style>
  :global(.modal-backdrop) {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    margin: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
  }
</style>

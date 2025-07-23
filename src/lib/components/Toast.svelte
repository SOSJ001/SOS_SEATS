<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let toast: {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    description: string;
    duration: number;
    show: boolean;
  };
  export let position:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center" = "top-right";

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close", { id: toast.id });
  }

  // Position classes
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  // Type-specific styling
  const typeStyles = {
    success: "bg-green-600 border-green-500 text-white",
    error: "bg-red-600 border-red-500 text-white",
    warning: "bg-yellow-600 border-yellow-500 text-white",
    info: "bg-blue-600 border-blue-500 text-white",
  };

  const typeIcons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };
</script>

{#if toast.show}
  <div
    class="max-w-sm w-full"
    transition:fly={{ y: 50, duration: 300, easing: quintOut }}
  >
    <div
      class="relative p-4 border rounded-lg shadow-lg {typeStyles[
        toast.type
      ]} transition-all duration-300 hover:shadow-xl"
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
    >
      <!-- Close button -->
      <button
        on:click={handleClose}
        class="absolute top-2 right-2 text-white/70 hover:text-white transition-colors duration-200"
        aria-label="Close toast"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>

      <!-- Toast content -->
      <div class="flex items-start space-x-3 pr-6">
        <!-- Icon slot -->
        <div class="flex-shrink-0">
          <slot name="icon">
            <div
              class="w-6 h-6 flex items-center justify-center rounded-full text-white text-sm font-bold"
              class:bg-green-500={toast.type === "success"}
              class:bg-red-500={toast.type === "error"}
              class:bg-yellow-500={toast.type === "warning"}
              class:bg-blue-500={toast.type === "info"}
            >
              {typeIcons[toast.type]}
            </div>
          </slot>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Title -->
          <h4 class="text-sm font-semibold mb-1">
            {toast.title}
          </h4>

          <!-- Description -->
          <p class="text-sm opacity-90">
            {toast.description}
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
 
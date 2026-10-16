<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import CircleCheck from "lucide-svelte/icons/circle-check";
  import CircleX from "lucide-svelte/icons/circle-x";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import Info from "lucide-svelte/icons/info";
  import X from "lucide-svelte/icons/x";

  export let toast: {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    description: string;
    duration: number;
    show: boolean;
  };

  const dispatch = createEventDispatcher();

  const tones = {
    success: {
      card: "border-green-600/30 bg-[#ecfdf5]",
      icon: "text-green-600",
      Icon: CircleCheck,
    },
    error: {
      card: "border-red-500/30 bg-[#fef2f2]",
      icon: "text-red-500",
      Icon: CircleX,
    },
    warning: {
      card: "border-[#efc96a] bg-[#fff9eb]",
      icon: "text-[#d97706]",
      Icon: TriangleAlert,
    },
    info: {
      card: "border-brand/25 bg-brand-soft",
      icon: "text-brand",
      Icon: Info,
    },
  };

  $: tone = tones[toast.type] || tones.info;
  $: role = toast.type === "error" ? "alert" : "status";

  function handleClose() {
    dispatch("close", { id: toast.id });
  }
</script>

{#if toast.show}
  <div
    class="w-[calc(100vw-2rem)] max-w-[360px] rounded-xl border p-3 shadow-[0px_12px_16px_rgba(18,4,28,0.12)] {tone.card}"
    {role}
    transition:fly={{ y: 12, duration: 300, easing: quintOut }}
  >
    <div class="flex items-start gap-3">
      <svelte:component
        this={tone.Icon}
        size={18}
        strokeWidth={2}
        class="mt-0.5 shrink-0 {tone.icon}"
        aria-hidden="true"
      />

      <div class="min-w-0 flex-1">
        <h4 class="m-0 text-sm font-extrabold text-ink">{toast.title}</h4>
        {#if toast.description}
          <p class="m-0 mt-0.5 text-xs leading-[1.4] text-ink-secondary">
            {toast.description}
          </p>
        {/if}
      </div>

      <button
        type="button"
        class="-mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-ink-muted hover:bg-paper-cream hover:text-ink"
        aria-label="Close"
        on:click={handleClose}
      >
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  </div>
{/if}

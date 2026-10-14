<script lang="ts">
  import { Check, X } from "lucide-svelte";

  export let text: string;
  export let tone: "green" | "red" = "green";
  export let title = "";

  $: red = tone === "red";
</script>

<div
  class="flex items-center gap-3 border border-solid p-4 lg:p-3 {red
    ? 'rounded-xl border-[#ef4444] bg-[#fef2f2]'
    : 'rounded-2xl border-[#22c55e] bg-[#ecfdf5]'}"
  role="status"
>
  <span
    class="flex size-8 shrink-0 items-center justify-center rounded-full {red
      ? 'bg-[rgba(239,68,68,0.12)] text-[#ef4444]'
      : 'bg-[rgba(34,197,94,0.12)] text-[#22c55e]'}"
    aria-hidden="true"
  >
    {#if red}
      <X size={16} strokeWidth={3} />
    {:else}
      <Check size={16} strokeWidth={3} />
    {/if}
  </span>
  {#if title}
    <div class="flex min-w-0 flex-1 flex-col gap-0.5 leading-normal">
      <p class="m-0 text-sm font-bold text-ink">{title}</p>
      <p class="m-0 text-xs text-ink-secondary">{text}</p>
    </div>
  {:else}
    <p class="m-0 min-w-0 flex-1 text-[13px] font-bold leading-normal text-ink">{text}</p>
  {/if}
</div>

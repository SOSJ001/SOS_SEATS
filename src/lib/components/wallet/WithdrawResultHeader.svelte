<script lang="ts">
  import { Check } from "lucide-svelte";

  export let title: string;
  export let message: string;
</script>

<div class="flex flex-col items-center gap-3">
  <div
    class="flex size-24 items-center justify-center rounded-full border-2 border-solid border-[#22c55e] bg-[#ecfdf5] shadow-[0_0_12px_rgba(34,197,94,0.12)] lg:size-16"
    aria-hidden="true"
  >
    <div
      class="flex size-20 items-center justify-center rounded-full border-2 border-solid border-[#22c55e] bg-paper lg:size-14"
    >
      <Check size={32} strokeWidth={3} class="text-[#22c55e] lg:size-6" />
    </div>
  </div>
  <div class="flex w-full flex-col items-center gap-1.5 text-center leading-normal">
    <h1 class="m-0 w-full text-[22px] font-extrabold text-ink">{title}</h1>
    <p class="m-0 w-full text-[13px] font-medium text-ink-secondary">{message}</p>
  </div>
</div>

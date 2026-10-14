<script lang="ts">
  import { X } from "lucide-svelte";

  export let title: string;
  export let message: string;
</script>

<div
  class="flex flex-col items-center gap-3 rounded-[20px] border border-solid border-paper-border bg-gradient-to-r from-[#fff1f1] to-[#fee2e2] px-8 pb-8 pt-10 text-center shadow-[0_8px_12px_rgba(18,4,28,0.04)] lg:gap-2 lg:px-5 lg:pb-5 lg:pt-6"
>
  <div
    class="flex size-20 items-center justify-center rounded-full border-2 border-solid border-[#ef4444] bg-[rgba(239,68,68,0.12)] lg:size-14"
    aria-hidden="true"
  >
    <X size={32} strokeWidth={3} class="text-[#ef4444] lg:size-6" />
  </div>
  <h1 class="m-0 w-full text-2xl font-bold leading-normal text-[#d92e2e] lg:text-xl">{title}</h1>
  <p class="m-0 w-full text-sm leading-normal text-[#737380]">{message}</p>
</div>

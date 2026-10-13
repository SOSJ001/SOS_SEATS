<script>
  // @ts-nocheck
  /** Door empty card with the animated stage: mobile 1540:7160 / desktop 1553:6574. */
  import PublicEmptyStage from "$lib/components/public/PublicEmptyStage.svelte";

  export let title = "";
  export let body = "";
</script>

<div
  class="flex w-full flex-col items-center gap-5 overflow-hidden rounded-[20px] border border-paper-border bg-[#faf9f7] px-5 py-4"
>
  <div class="md:hidden flex w-full justify-center">
    <PublicEmptyStage variant="mobile" className="w-full max-w-[262px]" />
  </div>
  <div class="hidden md:block w-full max-w-[520px]">
    <PublicEmptyStage />
  </div>

  <div class="flex w-full flex-col gap-2 text-center">
    <p class="m-0 font-display text-xl font-bold leading-normal text-[#0f1729]">{title}</p>
    {#if body}
      <p class="m-0 text-sm leading-[1.5] text-[#6b5f78]">{body}</p>
    {/if}
  </div>
</div>

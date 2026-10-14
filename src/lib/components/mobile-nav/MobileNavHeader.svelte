<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  import X from "lucide-svelte/icons/x";
  import AuthedWordmark from "$lib/components/authed/AuthedWordmark.svelte";

  const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col gap-3 px-6 pb-5 pt-6">
  <div class="flex items-center justify-between">
    <AuthedWordmark variant="light" />
    <button
      type="button"
      class="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-paper-border text-ink"
      aria-label="Close"
      on:click={() => dispatch("close")}
    >
      <X size={20} aria-hidden="true" />
    </button>
  </div>
  <div class="h-px w-full bg-paper-border"></div>
</div>

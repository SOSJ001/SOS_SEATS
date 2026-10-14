<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<div class="flex justify-center px-6 pb-8 pt-4">
  <button
    type="button"
    class="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-[#d92626]"
    on:click={() => dispatch("logout")}
  >
    Logout
  </button>
</div>

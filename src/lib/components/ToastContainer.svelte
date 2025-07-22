<script lang="ts">
  import { toastStore, hideToast } from "$lib/store";
  import Toast from "./Toast.svelte";

  export let position:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center" = "bottom-right";
</script>

<!-- Toast Container -->
<div
  class="fixed z-[9999] pointer-events-none bottom-4 right-4 flex flex-col-reverse gap-3"
>
  {#each $toastStore.toasts as toast, index (toast.id)}
    <div class="pointer-events-auto">
      <Toast {toast} {position} on:close={(e) => hideToast(e.detail.id)} />
    </div>
  {/each}
</div>

<script lang="ts">
  import { toastStore, hideToast } from "$lib/store";
  import Toast from "./Toast.svelte";
</script>

<div
  class="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3"
>
  {#each $toastStore.toasts as toast (toast.id)}
    <div class="pointer-events-auto">
      <Toast {toast} on:close={(e) => hideToast(e.detail.id)} />
    </div>
  {/each}
</div>

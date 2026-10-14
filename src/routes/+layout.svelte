<script>
  // @ts-nocheck
  import "../app.postcss";
  import "./globalStyle.css";
  import { sessionFromDb } from "$lib/store";
  import { onMount } from "svelte";
  import { setupSmoothScrolling } from "$lib/utils/smoothScroll.js";
  import SolanaWalletProvider from "$lib/components/SolanaWalletProvider.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";

  export let data;

  /** Reactive: sign-in finishes with invalidateAll() + goto(), not a full reload. */
  $: if (data.cookievar1 !== undefined) sessionFromDb.set(data.cookievar1);

  onMount(() => {
    setupSmoothScrolling();
  });
</script>

<SolanaWalletProvider>
  <div class="min-h-screen flex flex-col">
    <main class="flex-1">
      <slot />
    </main>
  </div>
</SolanaWalletProvider>

<ToastContainer />

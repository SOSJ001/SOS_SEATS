<script>
  // @ts-nocheck
  import "../app.postcss";
  import "./globalStyle.css";
  import TopNav from "$lib/components/TopNav.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { sessionFromDb } from "$lib/store";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { setupSmoothScrolling } from "$lib/utils/smoothScroll.js";
  import SolanaWalletProvider from "$lib/components/SolanaWalletProvider.svelte";
  import ScrollObserver from "$lib/components/ScrollObserver.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";

  export let data;

  if (data.cookievar1 !== undefined) {
    sessionFromDb.set(data.cookievar1);
  }

  onMount(() => {
    setupSmoothScrolling();
  });

  $: isDashboardRoute = $page.url.pathname.startsWith("/dashboard");
  $: path = $page.url.pathname;
  $: isPublicRoute =
    path === "/" ||
    path.startsWith("/marketplace") ||
    path.startsWith("/sign-in") ||
    path.startsWith("/sign-up");
</script>

{#if !isDashboardRoute && !isPublicRoute}
  <TopNav />
{/if}

<SolanaWalletProvider>
  <ScrollObserver />
  <div
    class="{isDashboardRoute || isPublicRoute ? '' : 'pt-16'} min-h-screen flex flex-col"
  >
    <main class="flex-1">
      <slot />
    </main>

    {#if !isDashboardRoute && !isPublicRoute}
      <Footer />
    {/if}
  </div>
</SolanaWalletProvider>

<ToastContainer />

<script>
  // @ts-nocheck
  import { page } from "$app/stores";
  import "$lib/styles/public-tokens.css";
  import PublicTopBar from "$lib/components/public/PublicTopBar.svelte";
  import PublicFooter from "$lib/components/public/PublicFooter.svelte";

  $: path = $page.url.pathname;
  $: isAuthRoute =
    path.startsWith("/sign-in") ||
    path.startsWith("/sign-up") ||
    (path.includes("/marketplace/eventDetails/") && path.endsWith("/claim"));
  $: isCheckoutRoute =
    path.includes("/marketplace/eventDetails/") && path.includes("/checkout");
</script>

{#if isAuthRoute}
  <div class="public-shell min-h-screen bg-white lg:h-screen lg:h-[100dvh] lg:overflow-hidden">
    <slot />
  </div>
{:else if isCheckoutRoute}
  <div
    class="public-shell flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-public-page"
  >
    <PublicTopBar />
    <div class="flex min-h-0 flex-1 flex-col">
      <slot />
    </div>
  </div>
{:else}
  <div class="public-shell flex flex-col min-h-screen bg-public-page">
    <PublicTopBar />
    <div class="flex-1">
      <slot />
    </div>
    <PublicFooter />
  </div>
{/if}

<script>
  // @ts-nocheck
  import { page } from "$app/stores";
  import "$lib/styles/public-tokens.css";
  import PublicTopBar from "$lib/components/public/PublicTopBar.svelte";
  import PublicFooter from "$lib/components/public/PublicFooter.svelte";

  $: path = $page.url.pathname;
  $: isAuthRoute = path.startsWith("/sign-in") || path.startsWith("/sign-up");
</script>

{#if isAuthRoute}
  <div class="public-shell min-h-screen lg:h-screen lg:h-[100dvh] lg:overflow-hidden bg-white">
    <slot />
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

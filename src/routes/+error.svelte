<script>
  // @ts-nocheck
  import { page } from "$app/stores";
  import "$lib/styles/public-tokens.css";
  import PublicTopBar from "$lib/components/public/PublicTopBar.svelte";
  import PublicFooter from "$lib/components/public/PublicFooter.svelte";
  import SearchX from "lucide-svelte/icons/search-x";
  import House from "lucide-svelte/icons/house";
  import Compass from "lucide-svelte/icons/compass";

  $: notFound = $page.status === 404;
  $: heading = notFound ? "Page not found" : "Something went wrong";
  $: message = notFound
    ? "The page you are looking for doesn't exist or has moved."
    : $page.error?.message || "Please try again in a moment.";
</script>

<svelte:head>
  <title>{heading} · SOS SEATS</title>
</svelte:head>

<div class="public-shell flex min-h-screen flex-col bg-public-page">
  <PublicTopBar userName={$page.data?.userName} />
  <div class="flex flex-1 items-center justify-center px-5 py-16">
    <div
      class="flex w-full max-w-[480px] flex-col items-center gap-4 rounded-2xl border border-paper-border bg-white px-6 py-10 text-center shadow-public-card"
    >
      <span class="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <SearchX class="size-7" aria-hidden="true" />
      </span>
      <p class="m-0 text-[13px] font-bold tracking-wide text-ink-secondary">
        Error {$page.status}
      </p>
      <h1 class="m-0 font-display text-2xl font-bold text-ink">{heading}</h1>
      <p class="m-0 text-sm leading-6 text-ink-secondary">{message}</p>
      <div class="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href="/"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white no-underline hover:opacity-90"
        >
          <House class="size-4" aria-hidden="true" />
          Back to home
        </a>
        <a
          href="/marketplace"
          class="inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-brand px-5 py-3 text-sm font-bold text-brand no-underline hover:bg-brand-ghost"
        >
          <Compass class="size-4" aria-hidden="true" />
          Browse events
        </a>
      </div>
    </div>
  </div>
  <PublicFooter />
</div>

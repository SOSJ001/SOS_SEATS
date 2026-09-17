<script>
  // @ts-nocheck
  /**
   * Public top bar from HI-FI DesktopNavbar 55:9.
   */
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { sessionFromDb } from "$lib/store";

  $: isLoggedIn = !!$sessionFromDb;
  $: path = $page.url.pathname;
  $: onBrowse = path === "/" || path.startsWith("/marketplace");

  function goOrLogin(next) {
    if (isLoggedIn) goto(next);
    else goto(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  function openSignIn() {
    goto("/sign-in");
  }

  const navIdle =
    "font-semibold text-[13px] text-ink-secondary hover:text-brand bg-transparent border-0 p-0 cursor-pointer";
  const navActive =
    "font-extrabold text-[13px] text-brand bg-transparent border-0 p-0 cursor-pointer";
  const signIn =
    "inline-flex items-center font-bold text-[13px] text-brand border-[1.5px] border-brand rounded-lg px-5 py-[7px] bg-transparent hover:bg-brand-ghost cursor-pointer";
</script>

<header
  class="sticky top-0 z-40 flex items-center justify-between bg-paper border-b border-paper-border shadow-public-nav px-5 py-3.5 md:px-20"
>
  <a href="/" class="flex items-center gap-2 h-[25px]" aria-label="SOS SEATS home">
    <span class="w-1 h-[18px] rounded-sm bg-brand shrink-0" aria-hidden="true"></span>
    <span class="font-logo font-black tracking-[2px] text-[20px] leading-none whitespace-nowrap">
      <span class="text-brand">SOS</span><span class="text-ink-seats"> SEATS</span>
    </span>
  </a>

  <nav class="hidden md:flex items-center gap-8" aria-label="Primary">
    <a href="/marketplace" class={onBrowse ? navActive : navIdle}>Browse</a>
    <button type="button" class={navIdle} on:click={() => goOrLogin("/dashboard/my-tickets")}>
      My Tickets
    </button>
    <button
      type="button"
      class={navIdle}
      on:click={() => goOrLogin("/dashboard/events/createEvent")}
    >
      Create Event
    </button>
    {#if !isLoggedIn}
      <button type="button" class={signIn} on:click={openSignIn}>Sign In</button>
    {:else}
      <a href="/dashboard" class={signIn}>Dashboard</a>
    {/if}
  </nav>

  <nav class="flex md:hidden items-center gap-4" aria-label="Primary">
    <a href="/marketplace" class="font-extrabold text-[13px] text-brand">Browse</a>
    {#if !isLoggedIn}
      <button
        type="button"
        class="font-bold text-[13px] text-brand bg-transparent border-0 p-0 cursor-pointer"
        on:click={openSignIn}
      >
        Sign In
      </button>
    {:else}
      <a href="/dashboard" class="font-bold text-[13px] text-brand">Dashboard</a>
    {/if}
  </nav>
</header>

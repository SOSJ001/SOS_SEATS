<script>
  // @ts-nocheck
  /**
   * Door shell — HI-FI staff/scanner minimal top bar (530:195 / 4:851).
   */
  import AuthedWordmark from "./AuthedWordmark.svelte";
  import { authedLogout, initialsFromName } from "./authedLogout.js";

  export let userName = "User";

  $: initials = initialsFromName(userName);
</script>

<div class="authed-shell min-h-screen flex flex-col bg-public-page text-ink">
  <header
    class="sticky top-0 z-30 flex items-center justify-between bg-paper border-b border-black/[0.06] px-5 py-3.5 md:px-8 md:py-4"
  >
    <AuthedWordmark variant="light" href="/dashboard/scanner" />

    <div class="flex items-center gap-3 md:gap-4">
      <div class="hidden sm:flex flex-col items-end gap-0.5 mr-1">
        <span class="text-[10px] font-extrabold tracking-wide text-brand uppercase"
          >STAFF/ORGANISER</span
        >
        <span class="text-sm font-semibold text-ink truncate max-w-[140px]">{userName}</span>
      </div>
      <div
        class="size-8 rounded-2xl bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0"
        aria-hidden="true"
      >
        {initials}
      </div>
      <span class="sm:hidden text-sm font-semibold text-ink truncate max-w-[100px]">{userName}</span>
      <button
        type="button"
        class="text-sm font-semibold text-ink-secondary hover:text-brand bg-transparent border-0 p-0 cursor-pointer ml-1"
        on:click={authedLogout}
      >
        Logout
      </button>
    </div>
  </header>

  <main class="flex-1 overflow-y-auto">
    <div class="p-4 md:p-6">
      <slot />
    </div>
  </main>
</div>

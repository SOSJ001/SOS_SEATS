<script>
  // @ts-nocheck
  /**
   * Attendee shell: desktop 604:1491; mobile chrome 484:88 / Transfers 624:1340 (48px) + hamburger drawer.
   * Transfer form 36:890, Transfer Successful 311:265 and Transfer Failed 313:83 hide the mobile header.
   */
  import { page } from "$app/stores";
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
  import PublicFooter from "$lib/components/public/PublicFooter.svelte";
  import AuthedWordmark from "./AuthedWordmark.svelte";
  import LogoutConfirmModal from "./LogoutConfirmModal.svelte";
  import { authedLogout, initialsFromName } from "./authedLogout.js";

  export let userName = "User";

  let menuOpen = false;
  let showLogoutConfirm = false;

  $: path = $page.url.pathname;
  $: onAttendee = path.startsWith("/dashboard/my-tickets");
  $: onTransfers = path.startsWith("/dashboard/my-tickets/transfers");
  $: onTickets = onAttendee && !onTransfers;
  $: onTransferForm = $page.route.id === "/(authed)/dashboard/my-tickets/transfers/[ticketId]";
  $: onReceipt =
    $page.route.id === "/(authed)/dashboard/my-tickets/transfers/receipt/preview" ||
    $page.route.id === "/(authed)/dashboard/my-tickets/transfers/receipt/[transferId]";
  $: hideMobileHeader = (onTransferForm || onReceipt) && !$page.error;
  $: initials = initialsFromName(userName);

  function openMenu() {
    menuOpen = true;
  }
  function closeMenu() {
    menuOpen = false;
  }
</script>

<div class="authed-shell min-h-screen flex flex-col bg-public-page text-ink">
  <header
    class="sticky top-0 z-30 {hideMobileHeader
      ? 'hidden md:flex'
      : 'flex'} items-center justify-between px-5 md:px-20 md:py-5 {onAttendee
      ? 'bg-paper-cream py-2.5 md:border-b md:border-paper-border md:bg-paper'
      : 'border-b border-paper-border bg-paper py-3.5'}"
  >
    {#if onAttendee}
      <p class="m-0 text-[22px] font-bold leading-7 text-ink md:hidden">
        {onTransfers ? "Transfers" : "My Tickets"}
      </p>
      <div class="hidden md:block">
        <AuthedWordmark variant="light" href="/dashboard/my-tickets" />
      </div>
    {:else}
      <AuthedWordmark variant="light" href="/dashboard/my-tickets" />
    {/if}

    <nav class="hidden md:flex items-center gap-8" aria-label="Attendee">
      <a href="/dashboard/my-tickets" class="flex flex-col items-center gap-1">
        <span
          class="text-[15px] {onTickets
            ? 'font-bold text-brand'
            : 'font-medium text-ink-secondary'}"
        >
          My Tickets
        </span>
        {#if onTickets}
          <span class="h-0.5 w-6 rounded-sm bg-brand" aria-hidden="true"></span>
        {/if}
      </a>
      <a href="/dashboard/my-tickets/transfers" class="flex flex-col items-center gap-1">
        <span
          class="text-[15px] {onTransfers
            ? 'font-bold text-brand'
            : 'font-medium text-ink-secondary hover:text-brand'}"
        >
          Transfer
        </span>
        {#if onTransfers}
          <span class="h-0.5 w-6 rounded-sm bg-brand" aria-hidden="true"></span>
        {/if}
      </a>
      <a href="/marketplace" class="flex flex-col items-center gap-1">
        <span class="text-[15px] font-bold text-ink hover:text-brand">
          Browse
        </span>
      </a>
      <button
        type="button"
        class="text-[15px] font-semibold text-ink-secondary hover:text-brand bg-transparent border-0 p-0 cursor-pointer"
        on:click={() => (showLogoutConfirm = true)}
      >
        Logout
      </button>
    </nav>

    <button
      type="button"
      class="md:hidden flex items-center justify-center border-0 bg-transparent p-0 text-ink cursor-pointer {onAttendee
        ? 'size-6'
        : 'size-10 rounded-full bg-paper-border/40'}"
      aria-label="Open menu"
      on:click={openMenu}
    >
      <PublicIcon name="menu" size={onAttendee ? 24 : 22} />
    </button>
  </header>

  <main class="flex-1 w-full">
    <div
      class="mx-auto max-w-[1280px] px-5 md:px-20 {onAttendee
        ? 'overflow-x-hidden pb-6 pt-0 md:overflow-x-visible md:py-8'
        : 'py-6 md:py-8'}"
    >
      <slot />
    </div>
  </main>

  <div class="hidden md:block mt-auto">
    <PublicFooter />
  </div>
</div>

{#if menuOpen}
  <div class="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
    <button
      type="button"
      class="absolute inset-0 bg-ink/60 border-0 cursor-pointer"
      aria-label="Close menu"
      on:click={closeMenu}
    ></button>
    <div
      class="absolute top-0 right-0 h-full w-[min(292px,92vw)] bg-paper shadow-[-4px_0_12px_rgba(0,0,0,0.15)] flex flex-col pb-8 pt-6 overflow-y-auto"
    >
      <div class="flex flex-col gap-3 px-6 pb-5 pt-6">
        <div class="flex items-center justify-between">
          <AuthedWordmark variant="light" href="/dashboard/my-tickets" />
          <button
            type="button"
            class="size-10 rounded-full bg-paper-border flex items-center justify-center text-ink text-lg font-semibold border-0 cursor-pointer"
            aria-label="Close"
            on:click={closeMenu}
          >
            ✕
          </button>
        </div>
        <div class="h-px w-full bg-paper-border"></div>
      </div>

      <div class="flex-1 flex flex-col gap-5 px-6 pb-6 pt-4">
        <div class="flex items-center gap-3">
          <div
            class="size-12 rounded-full bg-[#fff5f1] flex items-center justify-center text-brand text-base font-extrabold shrink-0"
          >
            {initials}
          </div>
          <div class="min-w-0">
            <p class="m-0 text-sm font-bold text-ink truncate">{userName}</p>
            <span
              class="inline-flex mt-1 px-1.5 py-0.5 rounded-full bg-brand text-white text-[8px] font-extrabold tracking-wide"
            >
              ATTENDEE
            </span>
          </div>
        </div>

        <nav class="flex flex-col gap-1.5" aria-label="Primary">
          <a
            href="/dashboard/my-tickets"
            class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-solid w-full {onTickets
              ? 'bg-[#fff5f1] border-brand'
              : 'bg-paper border-paper-border'}"
            on:click={closeMenu}
          >
            <span
              class="size-8 rounded-lg flex items-center justify-center shrink-0 {onTickets
                ? 'bg-brand/10 text-brand'
                : 'bg-[#f5f3f0] text-ink'}"
            >
              <PublicIcon name="ticket" size={18} />
            </span>
            <span class="flex-1 text-[15px] font-bold {onTickets ? 'text-brand' : 'text-ink'}"
              >My Tickets</span
            >
            <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
          </a>
          <a
            href="/dashboard/my-tickets/transfers"
            class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-solid w-full {onTransfers
              ? 'bg-[#fff5f1] border-brand'
              : 'bg-paper border-paper-border'}"
            on:click={closeMenu}
          >
            <span
              class="size-8 rounded-lg flex items-center justify-center shrink-0 {onTransfers
                ? 'bg-brand/10 text-brand'
                : 'bg-[#f5f3f0] text-ink'}"
            >
              <PublicIcon name="arrow-right" size={18} />
            </span>
            <span class="flex-1 text-[15px] font-bold {onTransfers ? 'text-brand' : 'text-ink'}"
              >Transfer</span
            >
            <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
          </a>
          <a
            href="/marketplace"
            class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-paper-border bg-paper w-full"
            on:click={closeMenu}
          >
            <span
              class="size-8 rounded-lg bg-[#f5f3f0] flex items-center justify-center text-ink shrink-0"
            >
              <PublicIcon name="store" size={18} />
            </span>
            <span class="flex-1 text-[15px] font-bold text-ink">Browse</span>
            <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
          </a>
        </nav>

        <div class="flex flex-col gap-1.5">
          <p class="m-0 text-xs font-bold uppercase text-ink-secondary">Support</p>
          <button
            type="button"
            class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-paper-border bg-paper w-full cursor-default text-left"
            disabled
            aria-disabled="true"
          >
            <span
              class="size-8 rounded-lg bg-[#f5f3f0] flex items-center justify-center text-ink shrink-0"
            >
              <PublicIcon name="settings" size={18} />
            </span>
            <span class="flex-1 text-[15px] font-semibold text-ink">Settings</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-paper-border bg-paper w-full cursor-default text-left"
            disabled
            aria-disabled="true"
          >
            <span
              class="size-8 rounded-lg bg-[#f5f3f0] flex items-center justify-center text-ink shrink-0"
            >
              <PublicIcon name="circle-help" size={18} />
            </span>
            <span class="flex-1 text-[15px] font-semibold text-ink">Help & Support</span>
          </button>
        </div>
      </div>

      <div class="px-6 pt-4 pb-8 flex justify-center">
        <button
          type="button"
          class="text-sm font-semibold text-[#d92626] bg-transparent border-0 p-0 cursor-pointer"
          on:click={() => (showLogoutConfirm = true)}
        >
          Logout
        </button>
      </div>
    </div>
  </div>
{/if}

<LogoutConfirmModal
  bind:open={showLogoutConfirm}
  on:confirm={authedLogout}
/>

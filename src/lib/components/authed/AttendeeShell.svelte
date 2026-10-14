<script>
  // @ts-nocheck
  /**
   * Attendee shell: desktop 604:1491; mobile chrome 484:88 / Transfers 624:1340 (48px) + hamburger drawer.
   * Transfer form 36:890, Transfer Successful 311:265 and Transfer Failed 313:83 hide the mobile header.
   */
  import { page } from "$app/stores";
  import PublicFooter from "$lib/components/public/PublicFooter.svelte";
  import AuthedWordmark from "./AuthedWordmark.svelte";
  import LogoutConfirmModal from "./LogoutConfirmModal.svelte";
  import { authedLogout, initialsFromName } from "./authedLogout.js";
  import MobileMenuButton from "$lib/components/mobile-nav/MobileMenuButton.svelte";
  import MobileNavDrawer from "$lib/components/mobile-nav/MobileNavDrawer.svelte";
  import MobileNavProfile from "$lib/components/mobile-nav/MobileNavProfile.svelte";
  import MobileNavItem from "$lib/components/mobile-nav/MobileNavItem.svelte";
  import MobileNavSupport from "$lib/components/mobile-nav/MobileNavSupport.svelte";
  import MobileNavLogout from "$lib/components/mobile-nav/MobileNavLogout.svelte";
  import { isNavActive } from "$lib/components/mobile-nav/isNavActive.js";

  export let userName = "User";

  let menuOpen = false;
  let showLogoutConfirm = false;

  $: path = $page.url.pathname;
  $: onAttendee = path.startsWith("/dashboard/my-tickets");
  $: onTransfers = path.startsWith("/dashboard/my-tickets/transfers");
  $: onTickets = onAttendee && !onTransfers;
  $: onTransferForm =
    $page.route.id === "/(authed)/dashboard/my-tickets/transfers/[ticketId]";
  $: onReceipt =
    $page.route.id ===
      "/(authed)/dashboard/my-tickets/transfers/receipt/preview" ||
    $page.route.id ===
      "/(authed)/dashboard/my-tickets/transfers/receipt/[transferId]";
  $: hideMobileHeader = (onTransferForm || onReceipt) && !$page.error;
  $: initials = initialsFromName(userName);

  const primary = [
    {
      id: "my-tickets",
      label: "My Tickets",
      mobileLabel: "My Tickets",
      sub: "View your event tickets",
      href: "/dashboard/my-tickets",
      icon: "ticket",
      mobileIcon: "ticket",
      exact: true,
    },
    {
      id: "transfers",
      label: "Transfer",
      mobileLabel: "Transfer",
      sub: "Send tickets to others",
      href: "/dashboard/my-tickets/transfers",
      icon: "arrow-right",
      mobileIcon: "arrow-right",
    },
    {
      id: "browse",
      label: "Browse",
      mobileLabel: "Browse",
      sub: "Find upcoming events",
      href: "/marketplace",
      icon: "store",
      mobileIcon: "store",
    },
  ];

  $: isActive = (item) => isNavActive(path, item);
  function openMenu() {
    menuOpen = true;
  }
  function closeMenu() {
    menuOpen = false;
  }
  function openLogout() {
    closeMenu();
    showLogoutConfirm = true;
  }
</script>

<div class="authed-shell min-h-screen flex flex-col bg-public-page text-ink">
  <!-- hrader -->
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
        <AuthedWordmark variant="light" />
      </div>
    {:else}
      <AuthedWordmark variant="light" />
    {/if}

    <!-- desktop navigation -->

    <nav class="hidden md:flex items-center gap-8" aria-label="Attendee">
      {#each primary as item}
        {@const active = isActive(item)}
        <a href={item.href} class="flex flex-col items-center gap-1">
          <span
            class="text-[15px] {active
              ? 'font-bold text-brand'
              : 'font-medium text-ink-secondary'}"
          >
            {item.label}
          </span>

          <!-- the line under the header navigation item -->
          {#if active}
            <span class="h-0.5 w-6 rounded-sm bg-brand" aria-hidden="true"
            ></span>
          {/if}
        </a>
      {/each}
      <!-- headerlogout button -->
      <button
        type="button"
        class="text-[15px] font-semibold text-ink-secondary hover:text-brand bg-transparent border-0 p-0 cursor-pointer"
        on:click={() => (showLogoutConfirm = true)}
      >
        Logout
      </button>
    </nav>

    <MobileMenuButton plain={onAttendee} class="md:hidden" on:click={openMenu} />
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

<MobileNavDrawer bind:open={menuOpen} hideFrom="md">
  <MobileNavProfile slot="profile" {initials} name={userName} badge="ATTENDEE" />
  {#each primary as item}
    <MobileNavItem
      href={item.href}
      icon={item.mobileIcon || item.icon}
      label={item.mobileLabel || item.label}
      sub={item.sub}
      active={isActive(item)}
      on:click={closeMenu}
    />
  {/each}
  <MobileNavSupport slot="support" on:navigate={closeMenu} />
  <MobileNavLogout slot="footer" on:logout={openLogout} />
</MobileNavDrawer>

<LogoutConfirmModal bind:open={showLogoutConfirm} on:confirm={authedLogout} />

<script>
  // @ts-nocheck
  /**
   * Organiser shell — HI-FI sidebar 55:858 + content topbar 55:896 + mobile 471:86.
   */
  import { page } from "$app/stores";
  import Wallet from "lucide-svelte/icons/wallet";
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
  import AuthedWordmark from "./AuthedWordmark.svelte";
  import LogoutConfirmModal from "./LogoutConfirmModal.svelte";
  import { authedLogout, initialsFromName } from "./authedLogout.js";
  import { organiserTopbarTitle } from "$lib/client/organiserUi";
  import MobileMenuButton from "$lib/components/mobile-nav/MobileMenuButton.svelte";
  import MobileNavDrawer from "$lib/components/mobile-nav/MobileNavDrawer.svelte";
  import MobileNavProfile from "$lib/components/mobile-nav/MobileNavProfile.svelte";
  import MobileNavItem from "$lib/components/mobile-nav/MobileNavItem.svelte";
  import MobileNavSupport from "$lib/components/mobile-nav/MobileNavSupport.svelte";
  import MobileNavLogout from "$lib/components/mobile-nav/MobileNavLogout.svelte";
  import { isNavActive } from "$lib/components/mobile-nav/isNavActive.js";

  export let userName = "User";
  /** @type {string | null} */
  export let linkedWalletAddress = null;

  let menuOpen = false;
  let showLogoutConfirm = false;

  $: path = $page.url.pathname;
  $: initials = initialsFromName(userName);
  $: linkedWalletLabel = truncateWallet(linkedWalletAddress);
  $: topbarTitle = $organiserTopbarTitle || titleForPath(path);
  $: mobileTitle = $organiserTopbarTitle || mobileTitleForPath(path);
  $: isCreateEvent = path.startsWith("/dashboard/events/createEvent");

  /**
   * @param {string | null | undefined} address
   */
  function truncateWallet(address) {
    if (!address || typeof address !== "string") return null;
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
  }

  /** HI-FI main-column topbar titles (55:896+). */
  function titleForPath(p) {
    if (p.startsWith("/dashboard/events/createEvent/step2")) return "Ticket Configuration";
    if (p.startsWith("/dashboard/events/createEvent/step3")) return "Customize Ticket Layout";
    if (p.startsWith("/dashboard/events/createEvent/step4")) return "Publish Settings";
    if (p.startsWith("/dashboard/events/createEvent/step5")) return "Status";
    if (p.startsWith("/dashboard/events/createEvent")) return "Create New Event";
    if (p.startsWith("/dashboard/events/editEvent")) return "Edit Event";
    if (p.startsWith("/dashboard/events/eventDetails")) return "Event Details";
    if (p.startsWith("/dashboard/events")) return "Events";
    if (p.startsWith("/dashboard/invite-staff")) return "Invite Door Staff & Scanner Accounts";
    if (p.startsWith("/dashboard/guests")) return "Guest List Management";
    if (p.startsWith("/dashboard/wallet")) return "Wallet & Proceeds";
    if (p.startsWith("/dashboard/settings")) return "Settings";
    if (p.startsWith("/dashboard/scanner")) return "Door Scanner";
    if (p === "/dashboard" || p === "/dashboard/") return "Dashboard Overview";
    return "Organiser";
  }

  /** Mobile top-header titles; null keeps the wordmark (471:86). */
  function mobileTitleForPath(p) {
    if (/^\/dashboard\/?$/.test(p)) return "Dashboard";
    if (/^\/dashboard\/events\/?$/.test(p)) return "My Events";
    if (p.startsWith("/dashboard/invite-staff")) return "Invite Door Staff";
    if (/^\/dashboard\/wallet(\/withdraw)?\/?$/.test(p)) return "Wallet & Proceeds";
    if (p.startsWith("/dashboard/settings")) return "Settings";
    return null;
  }

  const primary = [
    {
      id: "dashboard",
      label: "Dashboard",
      mobileLabel: "Dashboard",
      href: "/dashboard",
      icon: "layout-grid",
      sub: "Overview & analytics",
      exact: true,
    },
    {
      id: "events",
      label: "Events",
      mobileLabel: "Events",
      href: "/dashboard/events",
      icon: "calendar",
      sub: "Manage your events",
    },
    {
      id: "invite",
      label: "Invite Staff",
      mobileLabel: "Invite Staff",
      href: "/dashboard/invite-staff",
      icon: "user-plus",
      sub: "Add team members",
    },
    {
      id: "wallet",
      label: "Wallet & Proceeds",
      mobileLabel: "Wallet",
      href: "/dashboard/wallet",
      icon: "wallet",
      sub: "Revenue & payouts",
    },
    {
      id: "door",
      label: "Door Scanner",
      mobileLabel: "Door",
      href: "/dashboard/scanner",
      icon: "qr-code",
      mobileIcon: "door-open",
      sub: "Scan & check-in",
    },
    {
      id: "browse",
      label: "Browse Events",
      mobileLabel: "Browse Events",
      href: "/marketplace",
      icon: "compass",
      mobileIcon: "compass",
      sub: "Find upcoming events",
    },
  ];

  /** Reactive so the {#each} nav blocks re-run when `path` changes. */
  $: isActive = (item) => isNavActive(path, item);
  $: settingsActive = isActive({ href: "/dashboard/settings" });

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

<div class="authed-shell flex h-screen bg-public-page text-ink">
  <!-- Desktop sidebar (slate) -->
  <aside
    class="hidden lg:flex w-[260px] shrink-0 flex-col justify-between bg-slate-public p-6"
    aria-label="Organiser"
  >
    <div class="flex flex-col gap-8 w-full">
      <div class="pl-2 py-2">
        <AuthedWordmark variant="dark" />
      </div>
      <nav class="flex flex-col gap-2 w-full" aria-label="Primary">
        {#each primary as item}
          {@const active = isActive(item)}
          <a
            href={item.href}
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full {active
              ? 'bg-brand text-white font-bold'
              : 'text-white/70 font-medium hover:bg-white/[0.06] hover:text-white'}"
          >
          <!-- icon -->
            <PublicIcon name={item.icon} size={20} color="currentColor" />
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>
    </div>

    <div class="flex flex-col gap-3 w-full">
      <a
        href="/dashboard/settings"
        class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full {settingsActive
          ? 'bg-brand text-white font-bold'
          : 'text-white/70 font-medium hover:bg-white/[0.06] hover:text-white'}"
      >
        <PublicIcon name="settings" size={20} color="currentColor" />
        <span>Settings</span>
      </a>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
        <div
          class="size-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0"
        >
          {initials}
        </div>
        <div class="min-w-0 flex-1">
          <p class="m-0 text-[13px] font-bold text-white truncate">{userName}</p>
          {#if linkedWalletLabel}
            <p
              class="m-0 mt-0.5 text-[10px] text-white/50 truncate flex items-center gap-1"
              title={linkedWalletAddress}
            >
              <Wallet class="size-3 shrink-0 opacity-80" aria-hidden="true" />
              <span>Linked wallet · {linkedWalletLabel}</span>
            </p>
          {:else}
            <p class="m-0 text-[11px] text-ink-muted truncate">Organiser</p>
          {/if}
        </div>
      </div>
    </div>
  </aside>

  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- Mobile: event title when set (hub 208:58), else wordmark (471:86); hidden on create-event -->
    {#if !isCreateEvent}
      <header
        class="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-paper border-b border-paper-border px-5 py-3.5"
      >
        {#if mobileTitle}
          <h1
            class="m-0 min-w-0 flex-1 truncate text-[22px] font-bold leading-7 text-ink"
          >
            {mobileTitle}
          </h1>
        {:else}
          <AuthedWordmark variant="light" />
        {/if}
        <MobileMenuButton on:click={openMenu} />
      </header>
    {/if}

    <!-- Desktop: content topbar (HI-FI 55:896 / 55:1123) -->
    <header
      class="hidden lg:flex sticky top-0 z-30 h-[68px] shrink-0 items-center justify-between bg-paper border-b border-paper-border px-8"
    >
      <div class="flex items-center gap-3 min-w-0">
        <h1 class="m-0 text-[22px] font-bold leading-7 text-ink truncate">{topbarTitle}</h1>
        <span
          class="shrink-0 rounded-md bg-[#fff5f1] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-brand"
        >
          ORGANISER PORTAL
        </span>
      </div>
      
      <button
        type="button"
        class="shrink-0 rounded-lg border border-paper-border bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-paper-cream cursor-pointer"
        on:click={() => (showLogoutConfirm = true)}
      >
        Logout
      </button>
    </header>

    <main class="flex-1 overflow-y-auto bg-public-page">
      <div class="min-h-full p-4 md:p-6">
        <slot />
      </div>
    </main>
  </div>
</div>

<MobileNavDrawer bind:open={menuOpen} hideFrom="lg">
  <MobileNavProfile
    slot="profile"
    {initials}
    name={userName}
    walletLabel={linkedWalletLabel}
    walletAddress={linkedWalletAddress}
    badge="ORGANISER"
  />
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
  <MobileNavSupport slot="support" showSettings on:navigate={closeMenu} />
  <MobileNavLogout slot="footer" on:logout={openLogout} />
</MobileNavDrawer>

<LogoutConfirmModal
  bind:open={showLogoutConfirm}
  on:confirm={authedLogout}
/>

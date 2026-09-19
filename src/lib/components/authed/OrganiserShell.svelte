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

  export let userName = "User";
  /** @type {string | null} */
  export let linkedWalletAddress = null;

  let menuOpen = false;
  let showLogoutConfirm = false;

  $: path = $page.url.pathname;
  $: initials = initialsFromName(userName);
  $: linkedWalletLabel = truncateWallet(linkedWalletAddress);
  $: topbarTitle = titleForPath(path);
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
    if (p.startsWith("/dashboard/wallet/multisig")) return "Multi-Sig Approval Queue";
    if (p.includes("/pending-withdrawal") || p.includes("/withdraw")) return "Withdraw Funds";
    if (p.startsWith("/dashboard/wallet")) return "Wallet & Proceeds";
    if (p.startsWith("/dashboard/settings")) return "Settings";
    if (p === "/dashboard" || p === "/dashboard/") return "Dashboard Overview";
    return "Organiser";
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
  ];

  function isActive(item) {
    if (item.exact) return path === item.href;
    return path === item.href || path.startsWith(item.href + "/");
  }

  function openMenu() {
    menuOpen = true;
  }
  function closeMenu() {
    menuOpen = false;
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
            <PublicIcon name={item.icon} size={20} color="currentColor" />
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>
    </div>

    <div class="flex flex-col gap-3 w-full">
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
    <!-- Mobile: wordmark + hamburger (HI-FI 471:86); hidden on create-event (4:724 Exit chrome) -->
    {#if !isCreateEvent}
      <header
        class="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-paper border-b border-paper-border px-5 py-3.5"
      >
        <AuthedWordmark variant="light" />
        <button
          type="button"
          class="size-10 rounded-full bg-paper-border/40 flex items-center justify-center text-ink border-0 cursor-pointer"
          aria-label="Open menu"
          on:click={openMenu}
        >
          <PublicIcon name="menu" size={22} />
        </button>
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

{#if menuOpen}
  <div class="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
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
          <AuthedWordmark variant="light" />
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
            {#if linkedWalletLabel}
              <p
                class="m-0 mt-1 text-[11px] text-ink-secondary truncate flex items-center gap-1"
                title={linkedWalletAddress}
              >
                <Wallet class="size-3 shrink-0 opacity-80" aria-hidden="true" />
                <span>Linked wallet · {linkedWalletLabel}</span>
              </p>
            {/if}
            <span
              class="inline-flex mt-1 px-1.5 py-0.5 rounded-full bg-brand text-white text-[8px] font-extrabold tracking-wide"
            >
              ORGANISER
            </span>
          </div>
        </div>

        <nav class="flex flex-col gap-1.5" aria-label="Primary">
          {#each primary as item}
            {@const active = isActive(item)}
            <a
              href={item.href}
              class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-solid w-full {active
                ? 'bg-[#fff5f1] border-brand shadow-[0_4px_6px_rgba(255,90,31,0.1)]'
                : 'bg-paper border-paper-border'}"
              on:click={closeMenu}
            >
              <span
                class="size-8 rounded-lg flex items-center justify-center shrink-0 {active
                  ? 'bg-brand/10 text-brand'
                  : 'bg-[#f5f3f0] text-ink'}"
              >
                <PublicIcon name={item.mobileIcon || item.icon} size={18} />
              </span>
              <span class="flex-1 min-w-0 text-left">
                <span
                  class="block text-[15px] font-bold {active ? 'text-brand' : 'text-ink'}"
                  >{item.mobileLabel}</span
                >
                <span class="block text-xs text-ink-secondary truncate">{item.sub}</span>
              </span>
              <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
            </a>
          {/each}
        </nav>

        <div class="flex flex-col gap-1.5">
          <p class="m-0 text-xs font-bold uppercase text-ink-secondary">Support</p>
          <a
            href="/dashboard/settings"
            class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-paper-border bg-paper w-full"
            on:click={closeMenu}
          >
            <span
              class="size-8 rounded-lg bg-[#f5f3f0] flex items-center justify-center text-ink shrink-0"
            >
              <PublicIcon name="settings" size={18} />
            </span>
            <span class="flex-1 text-[15px] font-semibold text-ink">Settings</span>
            <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
          </a>
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

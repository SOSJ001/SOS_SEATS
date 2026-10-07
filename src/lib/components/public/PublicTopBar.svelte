<script>
  // @ts-nocheck
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { sessionFromDb } from "$lib/store";
  import AuthedWordmark from "$lib/components/authed/AuthedWordmark.svelte";
  import LogoutConfirmModal from "$lib/components/authed/LogoutConfirmModal.svelte";
  import { authedLogout } from "$lib/components/authed/authedLogout.js";
  import Wallet from "lucide-svelte/icons/wallet";
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
  import { initialsFromName } from "$lib/components/authed/authedLogout.js";

  export let userName = "User";
  export let initials = "USR";
  export let linkedWalletLabel = "";
  export let linkedWalletAddress = "";

  $: initials = initialsFromName(userName);
  $: isLoggedIn = !!$sessionFromDb;
  $: path = $page.url.pathname;

  // 1. Fixed: default menuOpen to false so it toggles cleanly
  let menuOpen = false;
  let showLogoutConfirm = false;

  const primary = [
    {
      id: "home",
      label: "Home",
      mobileLabel: "Home",
      href: "/",
      icon: "house",
      sub: "Back to landing page",
      exact: true,
    },
    {
      id: "browse",
      label: "Browse Events",
      mobileLabel: "Browse Events",
      href: "/marketplace",
      icon: "compass",
      sub: "Find upcoming events",
    },
    {
      id: "attendee",
      label: "My Tickets",
      mobileLabel: "Attendee",
      href: "/dashboard/my-tickets",
      icon: "ticket",
      sub: "View your tickets",
      authRequired: true,
    },
    {
      id: "organiser",
      label: "Organiser",
      mobileLabel: "Organiser",
      href: "/dashboard",
      icon: "briefcase",
      sub: "Dashboard & Analytics",
      authRequired: true,
    },
  ];

  $: isActive = (item) => {
    if (item.exact) return path === item.href;
    return path === item.href || path.startsWith(item.href + "/");
  };

  function handleNavClick(e, item) {
    if (item.authRequired && !isLoggedIn) {
      e.preventDefault();
      closeMenu();
      goOrLogin(item.href);
    } else {
      closeMenu();
    }
  }

  function goOrLogin(next) {
    if (isLoggedIn) goto(next);
    else goto(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  function openSignIn() {
    closeMenu();
    goto("/sign-in");
  }

  // 2. Fixed: Added closeMenu helper function
  function closeMenu() {
    menuOpen = false;
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
  <span class="flex items-center gap-2 h-[25px]" aria-label="SOS SEATS home">
    <AuthedWordmark />
  </span>

  <!-- desktop nav -->
  <nav class="hidden md:flex items-center gap-8" aria-label="Primary">
    {#each primary as item}
      {@const active = isActive(item)}
      <a
        href={item.href}
        on:click={(e) => handleNavClick(e, item)}
        class={active ? navActive : navIdle}>{item.label}</a
      >
    {/each}

    {#if !isLoggedIn}
      <button type="button" class={signIn} on:click={openSignIn}>Sign In</button
      >
    {:else}
      <button
        type="button"
        class="text-sm font-semibold text-[#d92626] bg-transparent border-0 p-0 cursor-pointer"
        on:click={() => (showLogoutConfirm = true)}
      >
        Logout
      </button>
    {/if}
  </nav>

  <!-- mobile nav button -->
  <nav class="flex md:hidden items-center gap-4" aria-label="Primary">
    <button
      type="button"
      class="size-10 shrink-0 rounded-full bg-paper-border/40 flex items-center justify-center text-ink border-0 cursor-pointer"
      aria-label="Open menu"
      on:click={() => (menuOpen = true)}
    >
      <PublicIcon name="menu" size={22} />
    </button>
  </nav>
</header>

{#if menuOpen}
  <div
    class="fixed inset-0 z-50 md:hidden"
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
  >
    <!-- Overlay backdrop click to close menu -->
    <button
      type="button"
      class="absolute inset-0 bg-ink/60 border-0 cursor-pointer w-full h-full"
      aria-label="Close menu"
      on:click={closeMenu}
    ></button>

    <div
      class="absolute top-0 right-0 h-full w-[min(292px,92vw)] bg-paper shadow-[-4px_0_12px_rgba(0,0,0,0.15)] flex flex-col pb-8 pt-6 overflow-y-auto z-10"
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
        <!-- user profile -->
        {#if isLoggedIn}
          <div class="flex items-center gap-3">
            <div
              class="size-12 rounded-full bg-[#fff5f1] flex items-center justify-center text-brand text-base font-extrabold shrink-0"
            >
              {initials}
            </div>
            <div class="min-w-0">
              <p class="m-0 text-sm font-bold text-ink truncate">Hi {userName}</p>
              {#if linkedWalletLabel}
                <p
                  class="m-0 mt-1 text-[11px] text-ink-secondary truncate flex items-center gap-1"
                  title={linkedWalletAddress}
                >
                  <Wallet
                    class="size-3 shrink-0 opacity-80"
                    aria-hidden="true"
                  />
                  <span>Linked wallet · {linkedWalletLabel}</span>
                </p>
              {/if}
            </div>
          </div>
        {:else}
          <button
            type="button"
            class="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm"
            on:click={openSignIn}
          >
            Sign In
          </button>
        {/if}

        <nav class="flex flex-col gap-1.5" aria-label="Primary Mobile">
          {#each primary as item}
            {@const active = isActive(item)}
            <a
              href={item.href}
              class="flex items-center gap-3 h-14 p-4 rounded-2xl border border-solid w-full {active
                ? 'bg-[#fff5f1] border-brand shadow-[0_4px_6px_rgba(255,90,31,0.1)]'
                : 'bg-paper border-paper-border'}"
              on:click={(e) => handleNavClick(e, item)}
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
                  class="block text-[15px] font-bold {active
                    ? 'text-brand'
                    : 'text-ink'}">{item.mobileLabel}</span
                >
                <span class="block text-xs text-ink-secondary truncate"
                  >{item.sub}</span
                >
              </span>
              <PublicIcon name="chevron-right" size={20} color="#9a92b3" />
            </a>
          {/each}
        </nav>

        <div class="flex flex-col gap-1.5">
          <p class="m-0 text-xs font-bold uppercase text-ink-secondary">
            Support
          </p>
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
            <span class="flex-1 text-[15px] font-semibold text-ink"
              >Settings</span
            >
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
            <span class="flex-1 text-[15px] font-semibold text-ink"
              >Help & Support</span
            >
          </button>
        </div>
      </div>

      {#if isLoggedIn}
        <div class="px-6 pt-4 pb-8 flex justify-center">
          <button
            type="button"
            class="text-sm font-semibold text-[#d92626] bg-transparent border-0 p-0 cursor-pointer"
            on:click={() => {
              closeMenu();
              showLogoutConfirm = true;
            }}
          >
            Logout
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<LogoutConfirmModal bind:open={showLogoutConfirm} on:confirm={authedLogout} />

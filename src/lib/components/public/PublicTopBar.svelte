<script>
  // @ts-nocheck
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { sessionFromDb } from "$lib/store";
  import AuthedWordmark from "$lib/components/authed/AuthedWordmark.svelte";
  import LogoutConfirmModal from "$lib/components/authed/LogoutConfirmModal.svelte";
  import { authedLogout } from "$lib/components/authed/authedLogout.js";
  import { initialsFromName } from "$lib/components/authed/authedLogout.js";
  import { signInHref } from "$lib/auth/postAuthRedirect.js";
  import MobileMenuButton from "$lib/components/mobile-nav/MobileMenuButton.svelte";
  import MobileNavDrawer from "$lib/components/mobile-nav/MobileNavDrawer.svelte";
  import MobileNavProfile from "$lib/components/mobile-nav/MobileNavProfile.svelte";
  import MobileNavItem from "$lib/components/mobile-nav/MobileNavItem.svelte";
  import MobileNavSupport from "$lib/components/mobile-nav/MobileNavSupport.svelte";
  import MobileNavLogout from "$lib/components/mobile-nav/MobileNavLogout.svelte";
  import { isNavActive } from "$lib/components/mobile-nav/isNavActive.js";

  export let userName = "User";
  export let initials = "USR";
  export let linkedWalletLabel = "";
  export let linkedWalletAddress = "";

  $: initials = initialsFromName(userName);
  $: isLoggedIn = !!$sessionFromDb;
  $: path = $page.url.pathname;

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
      role: "attendee",
    },
    {
      id: "organiser",
      label: "Organiser",
      mobileLabel: "Organiser",
      href: "/dashboard",
      icon: "briefcase",
      sub: "Dashboard & Analytics",
      authRequired: true,
      role: "organizer",
    },
  ];

  $: isActive = (item) => isNavActive(path, item);

  function handleNavClick(e, item) {
    if (item.authRequired && !isLoggedIn) {
      e.preventDefault();
      closeMenu();
      goto(signInHref(item.href, item.role));
    } else {
      closeMenu();
    }
  }

  function openSignIn() {
    closeMenu();
    goto("/sign-in");
  }

  function closeMenu() {
    menuOpen = false;
  }

  function openLogout() {
    closeMenu();
    showLogoutConfirm = true;
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
  <nav class="flex md:hidden items-center gap-4" aria-label="Menu">
    <MobileMenuButton on:click={() => (menuOpen = true)} />
  </nav>
</header>

<MobileNavDrawer bind:open={menuOpen} hideFrom="md">
  <svelte:fragment slot="profile">
    {#if isLoggedIn}
      <MobileNavProfile
        {initials}
        name={userName}
        greeting="Hi"
        walletLabel={linkedWalletLabel}
        walletAddress={linkedWalletAddress}
      />
    {:else}
      <button
        type="button"
        class="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm"
        on:click={openSignIn}
      >
        Sign In
      </button>
    {/if}
  </svelte:fragment>
  {#each primary as item}
    <MobileNavItem
      href={item.href}
      icon={item.mobileIcon || item.icon}
      label={item.mobileLabel || item.label}
      sub={item.sub}
      active={isActive(item)}
      on:click={(e) => handleNavClick(e, item)}
    />
  {/each}
  <MobileNavSupport slot="support" on:navigate={closeMenu} />
  <svelte:fragment slot="footer">
    {#if isLoggedIn}
      <MobileNavLogout on:logout={openLogout} />
    {/if}
  </svelte:fragment>
</MobileNavDrawer>

<LogoutConfirmModal bind:open={showLogoutConfirm} on:confirm={authedLogout} />

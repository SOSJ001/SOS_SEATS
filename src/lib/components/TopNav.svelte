<script lang="ts">
  import WalletConnectButton from "./WalletConnectButton.svelte";
  import { web3UserStore, activeSectionStore } from "$lib/store";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { slide, fade, scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let signup = false;

  let mobileMenuOpen = false;
  let isAuthenticated = false;
  let web3User = null;
  let activeSection = "home";
  let currentPath = "";

  // Subscribe to Web3 authentication state
  web3UserStore.subscribe((data) => {
    isAuthenticated = data.isAuthenticated;
    web3User = data.user;
  });

  // Subscribe to active section
  activeSectionStore.subscribe((section) => {
    activeSection = section;
  });

  // Subscribe to page to get current path
  page.subscribe(($page) => {
    currentPath = $page.url.pathname;
  });

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  // Smooth scroll to section
  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Smart navigation - navigate to home page and scroll to section, or just scroll if already on home
  async function handleSectionClick(sectionId: string) {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      // If not on home page, navigate to home page first
      await goto(`/#${sectionId}`);
    } else {
      // If already on home page, just scroll
      scrollToSection(sectionId);
    }
  }

  // Get section color based on active state
  function getSectionColor(sectionId: string, isActive: boolean) {
    if (!isActive) return "text-white hover:text-cyan-300";

    // Different colors for different sections based on UI color scheme
    switch (sectionId) {
      case "home":
        return "text-cyan-300"; // Cyan for home
      case "features":
        return "text-purple-400"; // Purple for features
      case "how-it-works":
        return "text-pink-400"; // Pink for how it works
      case "pricing":
        return "text-yellow-400"; // Yellow for pricing
      case "team":
        return "text-red-400"; // Red for team
      case "marketplace":
        return "text-blue-400"; // Blue for marketplace
      case "dashboard":
        return "text-green-400"; // Green for dashboard
      default:
        return "text-cyan-300";
    }
  }

  // Get underline color based on active state
  function getUnderlineColor(sectionId: string, isActive: boolean) {
    if (!isActive) return "bg-transparent";

    switch (sectionId) {
      case "home":
        return "bg-gradient-to-r from-cyan-400 to-purple-500";
      case "features":
        return "bg-gradient-to-r from-purple-400 to-pink-500";
      case "how-it-works":
        return "bg-gradient-to-r from-pink-400 to-red-500";
      case "pricing":
        return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "team":
        return "bg-gradient-to-r from-red-400 to-pink-500";
      case "marketplace":
        return "bg-gradient-to-r from-blue-400 to-cyan-500";
      case "dashboard":
        return "bg-gradient-to-r from-green-400 to-emerald-500";
      default:
        return "bg-gradient-to-r from-cyan-400 to-purple-500";
    }
  }
</script>

<nav
  class="fixed top-0 left-0 w-full px-4 sm:px-8 py-3 flex items-center justify-between bg-[#18191c] shadow-sm rounded-b-xl z-50 transition-all duration-500 ease-out"
>
  <!-- Logo -->
  <div
    class="text-xl sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent select-none"
    style="font-family: 'Roboto Slab', serif;"
  >
    SOS SEATS
  </div>

  <!-- Desktop Nav Links -->
  <ul
    class="hidden md:flex items-center space-x-6 lg:space-x-8 font-semibold text-white transition-all duration-500 ease-out"
    style="font-family: 'Roboto Slab', serif;"
  >
    <li>
      <button
        on:click={() => handleSectionClick("home")}
        class="relative transition-colors duration-300 {getSectionColor(
          'home',
          activeSection === 'home'
        )}"
      >
        Home
        <span
          class="absolute left-0 -bottom-1 w-full h-1 rounded transition-all duration-300 {getUnderlineColor(
            'home',
            activeSection === 'home'
          )}"
        ></span>
      </button>
    </li>
    <li>
      <button
        on:click={() => handleSectionClick("features")}
        class="transition-colors duration-300 {getSectionColor(
          'features',
          activeSection === 'features'
        )}"
      >
        Features
      </button>
    </li>
    <li>
      <button
        on:click={() => handleSectionClick("how-it-works")}
        class="transition-colors duration-300 {getSectionColor(
          'how-it-works',
          activeSection === 'how-it-works'
        )}"
      >
        How it Works
      </button>
    </li>
    <li>
      <button
        on:click={() => handleSectionClick("pricing")}
        class="transition-colors duration-300 {getSectionColor(
          'pricing',
          activeSection === 'pricing'
        )}"
      >
        Pricing
      </button>
    </li>
    <li>
      <button
        on:click={() => handleSectionClick("team")}
        class="transition-colors duration-300 {getSectionColor(
          'team',
          activeSection === 'team'
        )}"
      >
        Team
      </button>
    </li>
    <li>
      <a
        href="/marketplace"
        class="transition-colors duration-300 {currentPath === '/marketplace'
          ? 'text-blue-400'
          : 'text-white hover:text-cyan-300'}"
      >
        Marketplace
      </a>
    </li>
    <!-- Dashboard Link - Only show when authenticated -->
    {#if isAuthenticated}
      <li
        in:slide={{ duration: 400, easing: quintOut, axis: "x" }}
        out:slide={{ duration: 300, easing: quintOut, axis: "x" }}
        class="overflow-hidden"
      >
        <a
          href="/dashboard"
          class="transition-all duration-300 transform hover:scale-105 {getSectionColor(
            'dashboard',
            activeSection === 'dashboard'
          )}"
          in:fade={{ duration: 200, delay: 100 }}
          out:fade={{ duration: 150 }}
        >
          Dashboard
        </a>
      </li>
    {/if}
  </ul>

  <!-- Desktop Wallet Connect Button -->
  <div
    class="hidden md:block ml-4 transition-all duration-300 ease-out"
    class:animate-slideInFromRight={isAuthenticated}
  >
    <WalletConnectButton />
  </div>

  <!-- Desktop Get Started Button -->
  <!-- <button
    on:click={() => (signup = true)}
    class="hidden md:block ml-6 lg:ml-8 px-4 lg:px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-500 shadow-md hover:from-purple-500 hover:to-cyan-400 transition-all cursor-pointer"
    style="font-family: 'Roboto Slab', serif;"
    class:animate-scaleIn={isAuthenticated}
  >
    Get Started
  </button> -->

  <!-- Mobile Right Side - Wallet Button and Hamburger -->
  <div class="md:hidden flex items-center space-x-2">
    <!-- Mobile Wallet Connect Button -->
    <div class="mr-2">
      <WalletConnectButton />
    </div>

    <!-- Mobile Hamburger Button -->
    <button
      on:click={toggleMobileMenu}
      class="p-2 text-white hover:text-cyan-300 transition-all duration-300 ease-in-out"
      aria-label="Toggle mobile menu"
    >
      <svg
        class="w-6 h-6 transition-transform duration-300"
        class:rotate-90={mobileMenuOpen}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        {#if mobileMenuOpen}
          <!-- X icon when menu is open -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
            class="transition-all duration-300"
          ></path>
        {:else}
          <!-- Hamburger icon when menu is closed -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
            class="transition-all duration-300"
          ></path>
        {/if}
      </svg>
    </button>
  </div>
</nav>

<!-- Mobile Menu Overlay -->
{#if mobileMenuOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fadeIn"
    on:click={closeMobileMenu}
  ></div>
{/if}

<!-- Mobile Menu -->
<div
  class="fixed top-0 right-0 h-full w-64 bg-[#18191c] shadow-lg z-50 md:hidden transform transition-all duration-500 ease-in-out"
  class:translate-x-0={mobileMenuOpen}
  class:translate-x-full={!mobileMenuOpen}
>
  <div class="flex flex-col h-full">
    <!-- Mobile Menu Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-700">
      <div
        class="text-xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent animate-slideInLeft"
        style="font-family: 'Roboto Slab', serif;"
      >
        Menu
      </div>
      <button
        on:click={closeMobileMenu}
        class="p-2 text-white hover:text-cyan-300 transition-all duration-300 ease-in-out hover:scale-110"
      >
        <svg
          class="w-6 h-6 transition-transform duration-300"
          class:rotate-180={mobileMenuOpen}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>

    <!-- Mobile Nav Links -->
    <nav class="flex-1 px-6 py-8">
      <ul class="space-y-6 transition-all duration-500 ease-out">
        {#each [{ id: "home", text: "Home", delay: 0 }, { id: "features", text: "Features", delay: 100 }, { id: "how-it-works", text: "How it Works", delay: 200 }, { id: "pricing", text: "Pricing", delay: 300 }, { id: "team", text: "Team", delay: 400 }] as item, index}
          <li
            class="transform transition-all duration-500 ease-out"
            class:translate-x-0={mobileMenuOpen}
            class:translate-x-full={!mobileMenuOpen}
            style="transition-delay: {item.delay}ms;"
          >
            <button
              on:click={() => {
                handleSectionClick(item.id);
                closeMobileMenu();
              }}
              class="block text-lg font-semibold transition-all duration-300 py-2 border-b border-gray-700 hover:pl-2 w-full text-left {getSectionColor(
                item.id,
                activeSection === item.id
              )}"
              style="font-family: 'Roboto Slab', serif;"
            >
              {item.text}
            </button>
          </li>
        {/each}

        <!-- Marketplace Link -->
        <li
          class="transform transition-all duration-500 ease-out"
          class:translate-x-0={mobileMenuOpen}
          class:translate-x-full={!mobileMenuOpen}
          style="transition-delay: 500ms;"
        >
          <a
            href="/marketplace"
            on:click={closeMobileMenu}
            class="block text-lg font-semibold transition-all duration-300 py-2 border-b border-gray-700 hover:pl-2 {currentPath ===
            '/marketplace'
              ? 'text-blue-400'
              : 'text-white hover:text-cyan-300'}"
            style="font-family: 'Roboto Slab', serif;"
          >
            Marketplace
          </a>
        </li>
      </ul>
    </nav>

    <!-- Mobile Dashboard Button -->
    {#if isAuthenticated}
      <div
        class="p-6 border-t border-gray-700 transform transition-all duration-500 ease-out"
        class:translate-y-0={mobileMenuOpen}
        class:translate-y-full={!mobileMenuOpen}
        style="transition-delay: 600ms;"
      >
        <a
          href="/dashboard"
          on:click={closeMobileMenu}
          class="w-full px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-500 shadow-md hover:from-purple-500 hover:to-cyan-400 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg block text-center"
          style="font-family: 'Roboto Slab', serif;"
          in:scale={{ duration: 300, delay: 200 }}
          out:scale={{ duration: 200 }}
        >
          Dashboard
        </a>
      </div>
    {/if}

    <!-- Mobile Get Started Button -->
    <!-- <div
      class="p-6 border-t border-gray-700 transform transition-all duration-500 ease-out"
      class:translate-y-0={mobileMenuOpen}
      class:translate-y-full={!mobileMenuOpen}
      style="transition-delay: 600ms;"
    >
      <button
        on:click={() => {
          signup = true;
          closeMobileMenu();
        }}
        class="w-full px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-500 shadow-md hover:from-purple-500 hover:to-cyan-400 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg"
        style="font-family: 'Roboto Slab', serif;"
      >
        Get Started
      </button>
    </div> -->
  </div>
</div>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
  }

  .animate-slideInFromRight {
    animation: slideInFromRight 0.4s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }

  /* Smooth transition for navigation items when dashboard appears */
  nav ul li {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Dashboard link specific animations */
  nav ul li:has(a[href="/dashboard"]) {
    animation: slideInFromRight 0.4s ease-out;
  }

  /* Dashboard link glow effect */
  nav ul li:has(a[href="/dashboard"]) a {
    position: relative;
    overflow: hidden;
  }

  nav ul li:has(a[href="/dashboard"]) a::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(34, 197, 94, 0.2),
      transparent
    );
    transition: left 0.5s ease-out;
  }

  nav ul li:has(a[href="/dashboard"]) a:hover::before {
    left: 100%;
  }
</style>

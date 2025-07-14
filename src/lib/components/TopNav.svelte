<script>
  export let signup = false;

  let mobileMenuOpen = false;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<nav
  class="fixed top-0 left-0 w-full px-4 sm:px-8 py-3 flex items-center justify-between bg-[#18191c] shadow-sm rounded-b-xl z-50"
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
    class="hidden md:flex items-center space-x-6 lg:space-x-8 font-semibold text-white"
    style="font-family: 'Roboto Slab', serif;"
  >
    <li>
      <a href="/" class="relative text-cyan-300">
        Home
        <span
          class="absolute left-0 -bottom-1 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded transition-all"
        ></span>
      </a>
    </li>
    <li>
      <a href="/#features" class="hover:text-cyan-300 transition-colors"
        >Features</a
      >
    </li>
    <li>
      <a href="/#how-it-works" class="hover:text-cyan-300 transition-colors"
        >How it Works</a
      >
    </li>
    <li>
      <a href="/#pricing" class="hover:text-cyan-300 transition-colors"
        >Pricing</a
      >
    </li>
    <li>
      <a href="/#team" class="hover:text-cyan-300 transition-colors">Team</a>
    </li>
    <li>
      <a href="/marketplace" class="hover:text-cyan-300 transition-colors"
        >Marketplace</a
      >
    </li>
  </ul>

  <!-- Desktop Get Started Button -->
  <button
    on:click={() => (signup = true)}
    class="hidden md:block ml-6 lg:ml-8 px-4 lg:px-6 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-500 shadow-md hover:from-purple-500 hover:to-cyan-400 transition-all cursor-pointer"
    style="font-family: 'Roboto Slab', serif;"
  >
    Get Started
  </button>

  <!-- Mobile Hamburger Button -->
  <button
    on:click={toggleMobileMenu}
    class="md:hidden p-2 text-white hover:text-cyan-300 transition-all duration-300 ease-in-out"
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
      <ul class="space-y-6">
        {#each [{ href: "/", text: "Home", delay: 0 }, { href: "/#features", text: "Features", delay: 100 }, { href: "/#how-it-works", text: "How it Works", delay: 200 }, { href: "/#pricing", text: "Pricing", delay: 300 }, { href: "/#team", text: "Team", delay: 400 }, { href: "/marketplace", text: "Marketplace", delay: 500 }] as item, index}
          <li
            class="transform transition-all duration-500 ease-out"
            class:translate-x-0={mobileMenuOpen}
            class:translate-x-full={!mobileMenuOpen}
            style="transition-delay: {item.delay}ms;"
          >
            <a
              href={item.href}
              on:click={closeMobileMenu}
              class="block text-lg font-semibold text-white hover:text-cyan-300 transition-all duration-300 py-2 border-b border-gray-700 hover:border-cyan-400 hover:pl-2"
              style="font-family: 'Roboto Slab', serif;"
            >
              {item.text}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <!-- Mobile Get Started Button -->
    <div
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
    </div>
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

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideInLeft {
    animation: slideInLeft 0.5s ease-out;
  }
</style>

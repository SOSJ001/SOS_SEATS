<script>
  import { sessionFromDb } from "$lib/store";
  import { signOutbtnFunction } from "$lib/supabase";
  import {
    Navbar,
    NavBrand,
    NavHamburger,
    Drawer,
    CloseButton,
    Sidebar,
    SidebarWrapper,
  } from "flowbite-svelte";
//   sign out button function
  let signout = async  () => {
    
    const response = await fetch("/logoutApi", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    await signOutbtnFunction();
  };
  

  import { sineIn } from "svelte/easing";
  import sosSeats from "../assets/sosSeats.png";
  import { fade } from "svelte/transition";

  let hidden2 = true;
  let backdrop = false;
  let transitionParams = {
    x: -320,
    duration: 200,
    easing: sineIn,
  };
</script>

<Navbar
  navClass="px-1 py-2.5 fixed w-screen z-20 top-0 left-0 border-b bg-gray-800 px-3"
>
  <NavBrand href="/">
    <img src={sosSeats} class=" h-10" alt="SOS SEAT Logo" />
    <!-- <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Flowbite</span> -->
  </NavBrand>
  <div class="flex md:order-2">
    {#if $sessionFromDb !== null}
      <a
        on:click|preventDefault={signout}
        href="/"
        class="hover:text-yellow-500 text-white bg-yellow-400 rounded-lg px-3 py-2 hover:bg-white"
        >Logout</a>
    {:else}
      <slot name="login" />
      <slot name="signup" />
    {/if}
    <span class="z-60">
      <!-- <svelte:component this={ hidden2? NavHamburger : CloseButton } {props}/> -->
      <NavHamburger
        on:click={() => (hidden2 = false)}
        menuClass="h-6 w-6 shrink-0"
        class="text-white"
      />
    </span>
  </div>

  <!-- TOP NAV -->

  <div
    id="text"
    class=" text-white items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
  >
    <ul
      class="flex flex-col font-medium md:flex-row md:space-x-8 md:mt-0 items-center justify-center"
    >
    <li class="nav-item">
      <a
        class="flex gap-1 text-white hover:text-yellow-400"
        href="/"
        ><span class="text-xl">🏠</span><span>HOME</span></a
      >
    </li>
      {#if $sessionFromDb}
        <li out:fade class="nav-item">
          <a
            href="/dashboard"
            class="flex gap-1 text-white hover:text-yellow-400"
          >
            <span class="text-xl">🖥️</span>
            <span> DASHBOARD </span>
          </a>
        </li>
      {/if}
      <li class="nav-item">
        <a class="flex gap-1 text-white hover:text-yellow-400" href="/marketplace"
          ><span class="text-xl">🏬</span><span> MARKETPLACE</span></a
        >
      </li>
      <li class="nav-item">
        <a class="flex gap-1 text-white hover:text-yellow-400" href="/#/"
          ><span class="text-xl">ℹ️</span> <span> ABOUT US</span></a
        >
      </li>
    </ul>
  </div>
</Navbar>
<!-- TOP NAV ENDS -->

<!-- SIDE NAV -->
<Drawer
  class="bg-gray-800 z-10 md:hidden"
  {backdrop}
  width="w-50"
  transitionType="fly"
  {transitionParams}
  bind:hidden={hidden2}
>
  <div class="flex items-center pt-10 mt-5 mb-5 rounded-full">
    <hr class="w-5 h-1 bg-yellow-400 border-0 dark:bg-gray-700" />
    <hr class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded dark:bg-gray-700" />
    <hr class="w-5 h-1 bg-yellow-400 border-0 dark:bg-gray-700" />
    <!-- <hr class="w-8 h-8 mx-auto my-8 bg-gray-200 border-0 rounded  dark:bg-gray-700"> -->
    <hr class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded dark:bg-gray-700" />
    <hr class="w-5 h-1 bg-yellow-400 border-0 dark:bg-gray-700" />
    <CloseButton
      on:click={() => (hidden2 = true)}
      class="border border-solid border-yellow-400 text-white"
    />
  </div>
  <Sidebar asideClass="text-white">
    <SidebarWrapper divClass="overflow-y-auto px-3 rounded">
      <div class="h-full px-3 pb-4 overflow-y-auto bg-dark">
        <ul class="space-y-2 font-medium">
          <li>
            <a
              href="/"
              class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white">
              <span>🏠</span><span class="ml-3"> Home</span>
            </a>
          </li>
          {#if $sessionFromDb}
            <li>
              <a
                href="/dashboard"
                class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
              >
                <span>🖥️</span> <span class="ml-3">Dashboard</span>
              </a>
            </li>
          {/if}
          <li>
            <a
              href="/marketplace"
              class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
            >
              <span>🏬</span>
              <span class="ml-3">Marketplace</span>
            </a>
          </li>
          <li>
            <a
              href="/#/"
              class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
            >
              <span>ℹ️</span>
              <span class="ml-3">About Us</span>
            </a>
          </li>
        </ul>
      </div>
    </SidebarWrapper>
  </Sidebar>
</Drawer>

<!-- SIDE NAV ENDS -->


<script>
  import {
    CloseButton,
    Drawer,
    NavBrand,
    NavHamburger,
    Navbar,
    Sidebar,
    SidebarWrapper,
  } from "flowbite-svelte";
  import sosSeats from "../assets/sosSeats.png";
  import SidebarNav from "$lib/components/sidebarDash.svelte";
  import { sineIn } from "svelte/easing";
  let hidden2 = true;
  let backdrop = false;
  let transitionParams = {
    x: -320,
    duration: 200,
    easing: sineIn,
  };
</script>

<Navbar
  class="px-3 py-2.5 fixed w-screen z-20 top-0 left-0 border-b bg-gray-800"
>
  <NavBrand href="/">
    <img src={sosSeats} class="mr-2 h-10" alt="SOS SEAT Logo" />
  </NavBrand>
  <div class="flex md:order-2 items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 32 32"
      ><g fill="none"
        ><path
          fill="#F9C23C"
          d="M27.81 9H22.7c-.25 0-.46.174-.53.42c-.19.665-.8 1.157-1.51 1.157s-1.32-.481-1.51-1.157a.558.558 0 0 0-.53-.42H4.19C2.98 9 2 10.003 2 11.242v10.516C2 22.997 2.98 24 4.19 24h14.43c.25 0 .46-.174.53-.42c.19-.665.8-1.157 1.51-1.157s1.32.481 1.51 1.157c.07.246.28.42.53.42h5.11c1.21 0 2.19-1.003 2.19-2.242V11.242C30 10.003 29.02 9 27.81 9Zm-7.15 11.642c-.87 0-1.66-.743-1.66-1.634c0-.89.79-1.602 1.66-1.602c.87 0 1.596.711 1.596 1.602c0 .89-.726 1.634-1.596 1.634Zm0-5.038c-.87 0-1.648-.727-1.648-1.618c0-.89.778-1.617 1.648-1.617c.87 0 1.621.727 1.621 1.617c0 .891-.751 1.618-1.621 1.618Z"
        /><path
          fill="#D3883E"
          d="M10.116 14H5.884C5.395 14 5 13.569 5 13.035s.395-.965.884-.965h4.232c.489 0 .884.431.884.965c0 .545-.395.965-.884.965Zm-4.532 5h9.842c.313 0 .584-.223.574-.5c0-.277-.26-.5-.584-.5H5.584c-.323 0-.584.223-.584.5s.26.5.584.5Zm0 2h9.842c.313 0 .584-.232.574-.5c0-.277-.26-.5-.584-.5H5.584c-.323 0-.584.223-.584.5s.26.5.584.5Zm19.155-4h2.522c.41 0 .739.33.739.739v2.522c0 .41-.33.739-.739.739H24.74a.737.737 0 0 1-.739-.739V17.74c0-.41.33-.739.739-.739Z"
        /></g
      >
    </svg>
    <span class="text-white font-bold">
      HI <slot name="userName">SOSJ001</slot>
    </span>
    <span class="z-60">
      <!-- <svelte:component this={ hidden2? NavHamburger : CloseButton } {props}/> -->
      <NavHamburger
        on:click={() => (hidden2 = false)}
        menuClass="h-6 w-6 shrink-0"
        class="text-white"
      />
    </span>
  </div>
</Navbar>
<!-- SIDE NAV -->
<Drawer
  class="bg-gray-800 z-10 md:hidden w-[220px] overflow-hidden"
  {backdrop}
  width="w-50"
  transitionType="fly"
  {transitionParams}
  bind:hidden={hidden2}
>
  <div class="h-full overflow-y-auto bg-dark w-full overflow-hidden">
    <button class="w-full overflow-hidden" on:click={() => (hidden2 = true)}>
      <SidebarNav />
    </button>
  </div>
</Drawer>

<!-- SIDE NAV ENDS -->

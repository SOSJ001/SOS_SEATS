<script>
  // @ts-nocheck
  import "../app.postcss";
  import "./globalStyle.css";
  import TopNav from "$lib/components/TopNav.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { sessionFromDb, showToast } from "$lib/store";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import { Modal } from "flowbite-svelte";
  import { loginbtnFunction } from "$lib/supabase";
  import { createAccount } from "$lib/supabase";
  import Spinner from "$lib/components/Spinner.svelte";
  import { onMount } from "svelte";
  import { setupSmoothScrolling } from "$lib/utils/smoothScroll.js";
  import SolanaWalletProvider from "$lib/components/SolanaWalletProvider.svelte";
  import ScrollObserver from "$lib/components/ScrollObserver.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";
  import PWAInstallButton from "$lib/components/PWAInstallButton.svelte";

  export let data;

  // setting the cookie to the store value
  if (data.cookievar1 !== undefined) {
    sessionFromDb.set(data.cookievar1);
  }

  // Setup smooth scrolling on mount
  onMount(() => {
    setupSmoothScrolling();
  });

  // Check if we're in dashboard routes
  $: isDashboardRoute = $page.url.pathname.startsWith("/dashboard");

  let errorMessage = null;
  let login = false;
  let signup = false;
  let show = false;
  let disabled = false;
  let email;
  let password;
  let userName;
  let name;

  // when the login button is clicked....
  let loginBtnClicked = async () => {
    errorMessage = null;
    disabled = true;
    show = true;
    const { data, error } = await loginbtnFunction(email, password);
    if (error === null) {
      const sessionData = data.session; //set the session data and set the cookie
      const response = await fetch("/loginApi", {
        method: "POST",
        body: JSON.stringify({ sessionData }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      login = false;
      goto("/dashboard");
    } else {
      errorMessage = error.message;
    }
  };

  //if there is any error messsage reset all below
  $: {
    if (errorMessage !== null) {
      disabled = false;
      show = false;
    }

    if (!login && !signup) {
      email = "";
      password = "";
      userName = "";
      name = "";
      errorMessage = null;
      show = false;
    }
  }

  let SignUpBtnClicked = async () => {
    if (!email || !password || !userName || !name) {
      showToast("error", "Validation Error", "Please fill all required fields");
      return;
    } else if (password.length < 6) {
      errorMessage = "Password should be greater than 5";
      return;
    }
    errorMessage = null;
    const { data, error } = await createAccount(
      email,
      password,
      userName,
      name
    );
    if (!error) {
      disabled = true;
      show = true;
      const sessionData = data.session;
      // set the cookie
      const response = await fetch("/loginApi", {
        method: "POST",
        body: JSON.stringify({ sessionData }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      signup = false;
      goto("/dashboard");
    } else {
      // Handle error silently
      errorMessage = error.message;
    }
  };
</script>

<!-- Global TopNav for all routes except dashboard -->
{#if !isDashboardRoute}
  <TopNav bind:signup />
{/if}

<!-- Main content -->
<SolanaWalletProvider>
  <!-- Scroll Observer for navigation highlighting -->
  <ScrollObserver />
  <div class="{isDashboardRoute ? '' : 'pt-16'} min-h-screen flex flex-col">
    <main class="flex-1">
      <slot />
    </main>

    <!-- Global Footer for all routes except dashboard -->
    {#if !isDashboardRoute}
      <Footer />
    {/if}
  </div>
</SolanaWalletProvider>

<!-- Global login modal -->
{#if login}
  <div transition:fade>
    <Modal
      bind:open={login}
      size="sm"
      outsideclose
      autoclose
      class="bg-gray-700 text-white"
    >
      <div class="grid grid-rows text-center">
        <div>
          <h2 class="fontText text-3xl text-yellow-300">
            Login with Social Profile
          </h2>
          <div id="hover1" class="flex flex-row gap-4 m-4 justify-center">
            <div class=" rounded-full p-2 border border-white">
              <!-- facebook -->
              <a href="/#/">
                <svg
                  class="text-white text-sm"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z"
                  /></svg
                ></a
              >
            </div>
            <div class=" rounded-full p-2 border border-white">
              <!-- twitter -->
              <a href="/#/">
                <svg
                  class="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23Z"
                  /></svg
                ></a
              >
            </div>
            <div class=" rounded-full p-2 border border-white">
              <!-- google -->
              <a href="/#/">
                <svg
                  class="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                  /></svg
                ></a
              >
            </div>
            <div class=" rounded-full p-2 border border-white">
              <!-- linked-in  -->
              <a href="/#/">
                <svg
                  class="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 448 512"
                  ><path
                    fill="currentColor"
                    d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2c-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3c94 0 111.28 61.9 111.28 142.3V448z"
                  /></svg
                ></a
              >
            </div>
          </div>
        </div>
        <div class="">
          <div
            class="inline-flex items-center justify-center w-full text-gray-300 capitalize"
          >
            <hr
              class=" w-1/5 h-1 my-8 bg-gray-300 border-0 rounded dark:bg-gray-700"
            />
            <span class="text-center text-sm px-2">Or Login With</span>
            <hr
              class=" w-1/5 h-1 my-8 bg-gray-300 border-0 rounded dark:bg-gray-700"
            />
          </div>

          <form class="text-left">
            <!-- email  -->
            <div class="mb-3">
              <label for="email" class="block mb-2 text-sm font-medium"
                >Email address</label
              >
              <input
                bind:value={email}
                type="email"
                id="email"
                class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="john.doe@company.com"
                required
              />
            </div>
            <!-- password  -->
            <div class="mb-3">
              <label for="password" class="block mb-2 text-sm font-medium"
                >Password</label
              >
              <input
                bind:value={password}
                type="password"
                id="password"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="•••••••••"
                required
              />
            </div>

            <div class="flex justify-start mb-3">
              <div class="flex items-center h-5">
                <input
                  id="remember"
                  type="checkbox"
                  value=""
                  class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-yellow-500 text-yellow-300"
                  required
                />
              </div>
              <label for="remember" class="ml-2 text-sm font-medium"
                >I agree to the <a
                  class="text-yellow-300 hover:text-yellow-400"
                  href="/#/"
                  >Terms and Privacy Policy.
                </a></label
              >
            </div>
            <!-- login button  -->
            <button
              {disabled}
              on:click|preventDefault={loginBtnClicked}
              class="text-center w-full"
              ><div
                class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
              >
                {#if show}
                  <Spinner />
                {/if}

                <span>Login</span>
              </div>
            </button>
          </form>
          <div class=" capitalize m-3">
            Don't have an account? <a
              on:click|preventDefault|stopPropagation={() => {
                login = false;
                let time = setTimeout(() => {
                  signup = true;
                  clearTimeout(time);
                }, 1000);
              }}
              href="/#/"
              class="text-white hover:text-yellow-400 border border-yellow-400 hover:bg-white focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-1 text-center m-0"
              >Sign up now</a
            >
          </div>
        </div>
      </div>
    </Modal>
  </div>
{/if}

<!-- Global signup modal -->
{#if signup}
  <div transition:fade>
    <Modal
      bind:open={signup}
      size="sm"
      outsideclose
      autoclose
      class="bg-gray-700 text-white"
    >
      <div class="grid grid-rows text-center">
        <div>
          <h2 class="fontText text-3xl text-yellow-300">
            Create with Social Profile
          </h2>
          <div id="hover1" class="flex flex-row gap-4 m-4 justify-center">
            <div class=" rounded-full p-2 border border-white">
              <!-- facebook -->
              <a href="/#/">
                <svg
                  class="text-white text-sm"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z"
                  /></svg
                ></a
              >
            </div>
            <div class=" rounded-full p-2 border border-white">
              <!-- twitter -->
              <a href="/#/">
                <svg
                  class="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23Z"
                  /></svg
                ></a
              >
            </div>
            <div class=" rounded-full p-2 border border-white">
              <!-- google -->
              <a href="/#/">
                <svg
                  class="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                  /></svg
                ></a
              >
            </div>
            <div class=" rounded-full p-2 border border-white">
              <!-- linked-in  -->
              <a href="/#/">
                <svg
                  class="text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 448 512"
                  ><path
                    fill="currentColor"
                    d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2c-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3c94 0 111.28 61.9 111.28 142.3V448z"
                  /></svg
                ></a
              >
            </div>
          </div>
        </div>
        <div class="">
          <div
            class="inline-flex items-center justify-center w-full text-gray-300 capitalize"
          >
            <hr
              class=" w-1/5 h-1 my-8 bg-gray-300 border-0 rounded dark:bg-gray-700"
            />
            <span class="text-center text-sm px-2">Or Create With</span>
            <hr
              class=" w-1/5 h-1 my-8 bg-gray-300 border-0 rounded dark:bg-gray-700"
            />
          </div>

          <form class="text-left">
            <div class=" grid grid-cols-2 gap-2">
              <!-- name  -->
              <div class="mb-3">
                <label for="name" class="block mb-2 text-sm font-medium"
                  >Name</label
                >
                <input
                  bind:value={name}
                  type="text"
                  id="name"
                  class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Michael Johnson"
                  required
                />
              </div>
              <!-- user name  -->
              <div class="mb-3">
                <label for="userName" class="block mb-2 text-sm font-medium"
                  >Username</label
                >
                <input
                  bind:value={userName}
                  type="text"
                  id="userName"
                  class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="SOSJ001"
                  required
                />
              </div>
            </div>
            <!-- email  -->
            <div class="mb-3">
              <label for="email" class="block mb-2 text-sm font-medium"
                >Email address</label
              >
              <input
                bind:value={email}
                type="email"
                id="email"
                class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="john.doe@company.com"
                required
              />
            </div>
            <!-- password  -->
            <div class="mb-3">
              <label for="password" class="block mb-2 text-sm font-medium"
                >Password</label
              >
              <input
                bind:value={password}
                type="password"
                id="password"
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="•••••••••"
                required
              />
            </div>

            <div class="flex justify-start mb-3">
              <div class="flex items-center h-5">
                <input
                  id="remember"
                  type="checkbox"
                  value=""
                  class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-yellow-500 text-yellow-300"
                  required
                />
              </div>
              <label for="remember" class="ml-2 text-sm font-medium"
                >I agree to the <a
                  class="text-yellow-300 hover:text-yellow-400"
                  href="/#/"
                  >Terms and Privacy Policy.
                </a></label
              >
            </div>
            <!-- sign up button  -->
            <button
              {disabled}
              on:click|preventDefault={SignUpBtnClicked}
              class="text-center w-full"
              ><div
                class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
              >
                {#if show}
                  <Spinner />
                {/if}

                <span>Signup</span>
              </div>
            </button>
          </form>
          <div class=" capitalize m-3">
            have an account? <a
              on:click|preventDefault|stopPropagation={() => {
                signup = false;
                let time = setTimeout(() => {
                  login = true;
                  clearTimeout(time);
                }, 1000);
              }}
              href="/#/"
              class="text-white hover:text-yellow-400 border border-yellow-400 hover:bg-white focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-1 text-center m-0"
              >Login now</a
            >
          </div>
        </div>
      </div>
    </Modal>
  </div>
{/if}

<!-- Global Toast Container -->
<ToastContainer position="bottom-right" />

<!-- PWA Install Button -->
<PWAInstallButton />

<style>
  :global(body) {
    font-family: "Roboto Slab", serif;
  }
</style>

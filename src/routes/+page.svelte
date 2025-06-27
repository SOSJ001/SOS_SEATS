<script>
  import Banner from "$lib/components/Banner.svelte";
  import Search from "$lib/components/Search.svelte";
  import TopNav from "$lib/components/TopNav.svelte";
  import { sessionFromDb } from "$lib/store";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { Button, Modal } from "flowbite-svelte";
  import Spinner from "$lib/components/Spinner.svelte";
  import { loginbtnFunction } from "$lib/supabase";
  import { createAccount } from "$lib/supabase";
  import { onMount } from "svelte";

  export let data;
  $sessionFromDb = data.cookievar1;

  let errorMessage = null;
  let login = false;
  let signup = false;
  let show = false;
  let disabled = false;
  let email;
  let password;
  let userName;
  let name;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  // Login function
  let loginBtnClicked = async () => {
    errorMessage = null;
    disabled = true;
    show = true;
    const { data, error } = await loginbtnFunction(email, password);
    if (error === null) {
      const sessionData = data.session;
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

  // Signup function
  let SignUpBtnClicked = async () => {
    if (!email || !password || !userName || !name) {
      alert("Fill all required fields");
      return;
    } else if (password.length < 6) {
      errorMessage = "Password should be greater than 5 characters";
      return;
    }
    errorMessage = null;
    const { data, error } = await createAccount(email, password, userName, name);
    if (!error) {
      disabled = true;
      show = true;
      const sessionData = data.session;
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
      console.log(error);
      errorMessage = error.message;
    }
  };

  // Reset form when modals close
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
</script>

<svelte:head>
  <title>S.O.S SEATS - Your Digital Ticketing Solution</title>
  <meta name="description" content="Create, share, and manage digital tickets and invitations for events. Safe, secure, and reliable ticketing platform." />
</svelte:head>

<div class="min-h-screen bg-brand-dark">
  <!-- Navigation -->
  <TopNav>
    <svelte:fragment slot="login">
      {#if mounted}
        <button
          in:fade
          on:click={() => (login = true)}
          class="text-white hover:bg-brand-dark-secondary hover:text-brand-yellow rounded-lg px-4 py-2 mr-2 transition-all duration-300 font-medium"
        >
          LOGIN
        </button>
      {/if}
    </svelte:fragment>
    
    <svelte:fragment slot="signup">
      {#if mounted}
        <button
          in:fade
          on:click={() => (signup = true)}
          class="btn-primary"
        >
          SIGN UP
        </button>
      {/if}
    </svelte:fragment>
  </TopNav>

  <!-- Hero Section -->
  <Banner />

  <!-- Search Section -->
  <Search />

  <!-- Features Section -->
  <section class="py-20 px-4 bg-gradient-to-b from-brand-dark to-brand-dark-secondary">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="font-display text-3xl md:text-4xl font-bold text-white mb-4">
          Why Choose <span class="text-brand-yellow">S.O.S SEATS</span>?
        </h2>
        <p class="text-gray-300 text-lg max-w-2xl mx-auto">
          Experience the future of event ticketing with our innovative platform
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="glass-effect p-6 text-center group hover:scale-105 transition-all duration-300">
          <div class="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-yellow/30 transition-colors">
            <svg class="w-8 h-8 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h3 class="font-display text-xl font-semibold text-white mb-2">Secure & Safe</h3>
          <p class="text-gray-300">Advanced security measures protect your tickets and personal information</p>
        </div>
        
        <!-- Feature 2 -->
        <div class="glass-effect p-6 text-center group hover:scale-105 transition-all duration-300">
          <div class="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-accent/30 transition-colors">
            <svg class="w-8 h-8 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
            </svg>
          </div>
          <h3 class="font-display text-xl font-semibold text-white mb-2">Easy Sharing</h3>
          <p class="text-gray-300">Share tickets instantly via QR codes, email, or social media</p>
        </div>
        
        <!-- Feature 3 -->
        <div class="glass-effect p-6 text-center group hover:scale-105 transition-all duration-300">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
            <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h3 class="font-display text-xl font-semibold text-white mb-2">Real-time Tracking</h3>
          <p class="text-gray-300">Monitor attendance and manage your events in real-time</p>
        </div>
      </div>
    </div>
  </section>
</div>

<!-- Login Modal -->
{#if login}
  <div transition:fade>
    <Modal
      bind:open={login}
      size="sm"
      outsideclose
      autoclose
      class="bg-brand-dark-secondary text-white border border-brand-dark-tertiary"
    >
      <div class="p-6">
        <div class="text-center mb-6">
          <h2 class="font-display text-2xl font-bold text-brand-yellow mb-2">
            Welcome Back
          </h2>
          <p class="text-gray-300">Sign in to your account</p>
        </div>

        {#if errorMessage}
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4" in:fade>
            <p class="text-red-400 text-sm">{errorMessage}</p>
          </div>
        {/if}

        <form on:submit|preventDefault={loginBtnClicked} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              Email address
            </label>
            <input
              bind:value={email}
              type="email"
              id="email"
              class="input-field w-full"
              placeholder="john.doe@company.com"
              required
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              bind:value={password}
              type="password"
              id="password"
              class="input-field w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input type="checkbox" class="rounded border-brand-dark-tertiary text-brand-yellow focus:ring-brand-yellow">
              <span class="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
            <a href="#" class="text-sm text-brand-yellow hover:text-brand-yellow-light">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            {disabled}
            class="btn-primary w-full"
          >
            {#if show}
              <Spinner />
            {/if}
            Sign In
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-300">
            Don't have an account?
            <button
              on:click={() => { login = false; signup = true; }}
              class="text-brand-yellow hover:text-brand-yellow-light font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </Modal>
  </div>
{/if}

<!-- Signup Modal -->
{#if signup}
  <div transition:fade>
    <Modal
      bind:open={signup}
      size="sm"
      outsideclose
      autoclose
      class="bg-brand-dark-secondary text-white border border-brand-dark-tertiary"
    >
      <div class="p-6">
        <div class="text-center mb-6">
          <h2 class="font-display text-2xl font-bold text-brand-yellow mb-2">
            Create Account
          </h2>
          <p class="text-gray-300">Join S.O.S SEATS today</p>
        </div>

        {#if errorMessage}
          <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4" in:fade>
            <p class="text-red-400 text-sm">{errorMessage}</p>
          </div>
        {/if}

        <form on:submit|preventDefault={SignUpBtnClicked} class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                bind:value={name}
                type="text"
                id="name"
                class="input-field w-full"
                placeholder="Michael Johnson"
                required
              />
            </div>
            
            <div>
              <label for="userName" class="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                bind:value={userName}
                type="text"
                id="userName"
                class="input-field w-full"
                placeholder="SOSJ001"
                required
              />
            </div>
          </div>
          
          <div>
            <label for="signup-email" class="block text-sm font-medium text-gray-300 mb-2">
              Email address
            </label>
            <input
              bind:value={email}
              type="email"
              id="signup-email"
              class="input-field w-full"
              placeholder="john.doe@company.com"
              required
            />
          </div>
          
          <div>
            <label for="signup-password" class="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              bind:value={password}
              type="password"
              id="signup-password"
              class="input-field w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <label class="flex items-center">
            <input type="checkbox" class="rounded border-brand-dark-tertiary text-brand-yellow focus:ring-brand-yellow" required>
            <span class="ml-2 text-sm text-gray-300">
              I agree to the <a href="#" class="text-brand-yellow hover:text-brand-yellow-light">Terms and Privacy Policy</a>
            </span>
          </label>

          <button
            type="submit"
            {disabled}
            class="btn-primary w-full"
          >
            {#if show}
              <Spinner />
            {/if}
            Create Account
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-300">
            Already have an account?
            <button
              on:click={() => { signup = false; login = true; }}
              class="text-brand-yellow hover:text-brand-yellow-light font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </Modal>
  </div>
{/if}
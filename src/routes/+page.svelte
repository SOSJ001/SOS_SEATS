<script>
  //@ts-nocheck
  import Banner from "$lib/components/Banner.svelte";
  import Search from "$lib/components/Search.svelte";
  import { sessionFromDb } from "../lib/store";
  import { loginbtnFunction } from "$lib/supabase";
  import { goto } from "$app/navigation";
  import TopNav from "$lib/components/TopNav.svelte";
  import { Modal } from "flowbite-svelte";
  import { fade } from "svelte/transition";
  import { createAccount } from "$lib/supabase";
  import Spinner from "$lib/components/Spinner.svelte";
  import michael  from "$lib/assets/michael.jpeg";
  import  jnice  from "$lib/assets/jnice.jpeg";
  import jenny  from "$lib/assets/jenny.jpeg";

  export let data;
  // setting the cookie to the store value
  if (data.cookievar1 !== undefined) {
    sessionFromDb.set(data.cookievar1);
  }

  let errorMessage = null;
  let login = false;
  let signup = false;
  let show = false;
  let RegisterBtn;
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
  // login button ends;

  //if there is any error messsage reset all below
  $: {
    if (errorMessage !== null) {
      disabled = false;
      show = false;
      // console.log("here");
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
      alert("fill all required field");
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
      console.log(error);
      errorMessage = error.message;
    }
  };
</script>

<div class="bg-gray-800 items-center text-white overflow-hidden">
  <TopNav>
    <svelte:fragment slot="login">
      <a
        in:fade
        on:click={() => (login = true)}
        href="/"
        class="text-white hover:bg-gray-500 hover:text-white rounded-lg px-2 py-2 mr-1"
      >
        <span> LOGIN </span>
      </a>
    </svelte:fragment>
    <!-- sign up button here  -->
    <svelte:fragment slot="signup">
      <a
        in:fade
        on:click={() => (signup = true)}
        href="/"
        class="text-white bg-yellow-400 hover:bg-white hover:text-yellow-500 rounded-lg px-2 py-2"
      >
        <span> SIGNUP </span>
      </a>
    </svelte:fragment>
  </TopNav>
  <div class=" relative h-screen">
    <Banner />
  </div>
  <!-- brief description  -->
  <section class="py-20">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Icon Section -->
        <div class="flex justify-center items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-32 h-32 text-yellow-500"
            fill="none"
            viewBox="0 0 30 30"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11.049 2.927c.3-.921 1.601-.921 1.9 0l2.338 7.281a1 1 0 00.95.69h7.658c.969 0 1.371 1.24.588 1.81l-6.21 4.715a1 1 0 00-.36 1.118l2.366 7.613c.257.819-.662 1.485-1.363 1.068l-6.091-4.037a1 1 0 00-1.181 0l-6.091 4.037c-.701.417-1.62-.249-1.363-1.068l2.366-7.613a1 1 0 00-.36-1.118L1.354 12.708c-.783-.569-.381-1.81.588-1.81h7.658a1 1 0 00.95-.69l2.338-7.281z"
            />
          </svg>
        </div>
        <!-- Text Section -->
        <div class="flex flex-col justify-center space-y-6">
          <h2 class="text-3xl font-extrabold">
            Empowering Events And Transactions
          </h2>
          <p class="text-xl leading-relaxed">
            SOS SEATS is a cutting edge digital ticketing platform designed to
            revolutionize the event and transaction ecosystem in Sierra Leone.
            Our platform empowers users to create, share, verify, and trade
            tickets seamlessly.
          </p>
          <p class="text-xl leading-relaxed">
            By bridging the gap between traditional and local monetary systems
            with Solana blockchain, SOS SEATS ensures inclusive and accessible
            transactions for all users, regardless of their financial
            background.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- key features  -->
  <div class="bg-gray-700 md:mx-14 rounded-lg">
    <div class="container mx-auto px-4 py-8">
      <section class="py-8">
        <h2 class="text-3xl font-bold text-center mb-8">Key Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="rounded-lg shadow-md p-6">
            <div
              class="flex flex-col items-center justify-center mb-4 text-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2m6 10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10m6-10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10m6-10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10m6-10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10"
                />
              </svg>
              <h2 class="text-2xl font-bold">Invitation Management</h2>
            </div>
            <div class="flex flex-col justify-center items-center text-center">
              <div>Create and customize invitations and tickets</div>
              <div>Share invitations via email, social media, or QR code</div>
              <div>Managing of guest lists</div>
            </div>
          </div>

          <div class="rounded-lg shadow-md p-6">
            <div
              class="flex flex-col text-center items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h2m-2 4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"
                />
              </svg>
              <h2 class="text-2xl font-bold">Event Management</h2>
            </div>
            <div class="flex flex-col justify-center items-center">
              <div>Set pricing and ticketing options</div>
              <div>Create public or private events</div>
              <div>Schedule and promote events</div>
            </div>
          </div>

          <div class="rounded-lg shadow-md p-6">
            <div
              class="flex flex-col text-center items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v12m0-6a2 2 0 0 1 2 2 2 2 0 0 1-2 2V6a2 2 0 0 1 2-2 2 2 0 0 1-2-2z"
                />
              </svg>
              <h2 class="text-2xl font-bold">Ticket Verification</h2>
            </div>
            <div class="flex flex-col justify-center items-center">
              <div>QR code scanning</div>
              <div>Unique identifiers Checker</div>
              <div>Anti fraud measures</div>
            </div>
          </div>

          <div class="rounded-lg shadow-md p-6">
            <div
              class="flex flex-col text-center items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 8v8m0 0C18 10 19 12 20 14a2 2 0 0 1 0 4H4a2 2 0 0 1 0-4l4-4V8a2 2 0 0 1 2-2h8z"
                />
              </svg>
              <h2 class="text-2xl font-bold">Marketplace</h2>
            </div>
            <div class="flex flex-col justify-center items-center">
              <div>Buy and sell tickets</div>
              <div>Search and filtering</div>
              <div>Secure transactions</div>
            </div>
          </div>

          <div class="rounded-lg shadow-md p-6">
            <div
              class="flex flex-col text-center items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 text-pink-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15V3m0 0H9m4 0h4m-4 4h4m-4 4h4m-4 4v12m0 0H9m4 0h4"
                />
              </svg>
              <h2 class="text-2xl font-bold">Blockchain Integration</h2>
            </div>
            <div class="flex flex-col justify-center items-center">
              <div>Paying for tickets with blockchain transactions</div>
              <div>Creating Solana Wallet with a click</div>
              <div>Transfering Crypto</div>
              <div>Swaping local currency to crypto</div>
            </div>
          </div>

          <div class="rounded-lg shadow-md p-6">
            <div
              class="flex flex-col text-center items-center justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-12 h-12 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15V3m0 0H9m4 0h4m-4 4h4m-4 4h4m-4 4v12m0 0H9m4 0h4"
                />
              </svg>
              <h2 class="text-2xl font-bold">User Experience</h2>
            </div>
            <div class="flex flex-col justify-center items-center">
              <div>Easy to use interface</div>
              <div>Customer Care</div>
              <div>Mobile app compatibility</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- how it works: event creation -->
  <section class="py-10 bg-gray-800">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-extrabold text-center text-gray-100 mb-12">
        How It Works: Event Creation
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Step 1 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-blue-500 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4h16v16H4V4z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Sign Up / Login
          </h3>
          <p class="text-gray-300 text-center">
            Start by signing up or logging into your account to access the
            platform.
          </p>
        </div>

        <!-- Step 2 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-green-500 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 12l5 5L20 7"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Go to Dashboard
          </h3>
          <p class="text-gray-300 text-center">
            Once logged in, navigate to your dashboard and click on the "Create
            Event" button.
          </p>
        </div>

        <!-- Step 3 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-500 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4h16v16H4V4z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">Fill Details</h3>
          <p class="text-gray-300 text-center">
            Complete the event creation form by filling in all the necessary
            details and click "Create Event."
          </p>
        </div>

        <!-- Step 4 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-red-500 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l2 2"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Event Created
          </h3>
          <p class="text-gray-300 text-center">
            Your event has been successfully created and is now live on the
            platform.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- how to :place order -->
  <section class="py-10 bg-gray-800">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-extrabold text-center text-gray-100 mb-12">
        How to Place an Order for Seats
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Step 1 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-blue-600 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12h18M3 6h18M3 18h18"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Assigned Seats
          </h3>
          <p class="text-gray-300 text-center">
            For every event created, seats are assigned based on the total
            expected guests for that event.
          </p>
        </div>

        <!-- Step 2 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-green-600 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l2 2m4 4v-2a6 6 0 00-6-6V4"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Navigate to Seats
          </h3>
          <p class="text-gray-300 text-center">
            Go to the 'Seats' section on your dashboard to view available
            seating options for the event.
          </p>
        </div>

        <!-- Step 3 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-600 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l2 2m4 4v-2a6 6 0 00-6-6V4"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Fill Order Details
          </h3>
          <p class="text-gray-300 text-center">
            Enter the necessary details for your order including the number of
            seats and any special requests.
          </p>
        </div>

        <!-- Step 4 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-red-600 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4h16v16H4V4z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">Place Order</h3>
          <p class="text-gray-300 text-center">
            Review your order details and click the 'Place Order' button to
            complete the process.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- how to share event -->
  <section class="py-10 bg-gray-800">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-extrabold text-center text-gray-100 mb-12">
        How to Share Your Event
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Step 1 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-blue-700 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9h3v3H8V9zm0 4h3v3H8v-3zm4 3h3v3h-3v-3z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Public Events
          </h3>
          <p class="text-gray-300 text-center">
            If you specified your event as public during creation, it will be
            automatically available in the marketplace once seat ordering is
            completed.
          </p>
        </div>

        <!-- Step 2 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-green-700 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 9l5 5 5-5H7z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Private Events
          </h3>
          <p class="text-gray-300 text-center">
            For private events, go to the 'Events' section on your dashboard,
            find the event, and click the 'Share' button.
          </p>
        </div>

        <!-- Step 3 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-700 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m-8-8h16"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">Click Share</h3>
          <p class="text-gray-300 text-center">
            After locating your event, fill the required details and click the
            'Share' button to proceed.
          </p>
        </div>

        <!-- Step 4 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-red-700 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8l8-4 8 4v8l-8 4-8-4V8z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">Event Shared</h3>
          <p class="text-gray-300 text-center">
            The event will be shared based on the option you chose (QR,
            PASSCODE, EMAIL, SMS).
          </p>
        </div>
      </div>
    </div>
  </section>
  <!-- how to resell event -->
  <section class="py-10 bg-gray-800">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-extrabold text-center text-gray-100 mb-12">
        How to Resell a Ticket
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Step 1 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-blue-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 4a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2H10zM4 6h1.5a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5H4V6z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Decide to Resell
          </h3>
          <p class="text-gray-300 text-center">
            You have bought a ticket for an event, but now you want to resell it
            because you are unable to attend.
          </p>
        </div>

        <!-- Step 2 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-green-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h3v10H3V10zM15 10h3v10h-3V10z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Navigate to Event Page
          </h3>
          <p class="text-gray-300 text-center">
            Go to your dashboard and navigate to the event page on your
            dashboard.
          </p>
        </div>

        <!-- Step 3 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 3l14 14m-14 0l14-14M5 21l14-14"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Go to Bought Tab
          </h3>
          <p class="text-gray-300 text-center">
            On the event page, find the 'Bought' tab where your purchased
            tickets are listed.
          </p>
        </div>

        <!-- Step 4 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-red-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l2 2m4 4v-2a6 6 0 00-6-6V4"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">Click Resell</h3>
          <p class="text-gray-300 text-center">
            Click the 'Resell' button to relist your ticket on the marketplace.
          </p>
        </div>
      </div>
    </div>
  </section>
  <!-- creating wallet and transfering -->
  <section class="py-10 bg-gray-800">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-extrabold text-center text-gray-100 mb-12">
        Creating and Using Your Crypto Wallet
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Step 1 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-blue-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4h16v16H4V4z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Create Wallet
          </h3>
          <p class="text-gray-300 text-center">
            Navigate to the 'Wallet' section on your dashboard and create a new
            crypto wallet to start managing your tokens.
          </p>
        </div>

        <!-- Step 2 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-green-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9h3v3H8V9zm0 4h3v3H8v-3zm4 3h3v3h-3v-3z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Transfer Tokens
          </h3>
          <p class="text-gray-300 text-center">
            You can transfer tokens to other SOS SEATS users by using their
            username or directly to any Solana wallet address.
          </p>
        </div>

        <!-- Step 3 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-yellow-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 12l8-8 8 8H4z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Using Username
          </h3>
          <p class="text-gray-300 text-center">
            Transfer tokens to another user on SOS SEATS by entering their
            username during the transfer process.
          </p>
        </div>

        <!-- Step 4 -->
        <div
          class="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-900"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 bg-red-800 text-white rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v16h16V4H4z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Using Solana Address
          </h3>
          <p class="text-gray-300 text-center">
            Alternatively, transfer tokens to any Solana wallet address by
            providing the wallet address during the transfer.
          </p>
        </div>
      </div>
    </div>
  </section>
  <!-- the team -->
  <section class="py-20 bg-gray-800" id="aboutUs">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-extrabold text-center text-gray-100 mb-12">
        Meet the Team
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Team Member 1 -->
        <div
          class="flex flex-col items-center p-6 bg-gray-900 rounded-lg shadow-lg"
        >
          <img
            src={jenny}
            alt="Team Member 1"
            class="w-32 h-32 mb-4 rounded-full object-cover"
          />
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Jennifer E.K Kargbo
          </h3>
          <p class="text-gray-300 text-center">
            Lead writer with over 7 years of experience in content creation, writing and literature
          </p>
        </div>

        <!-- Team Member 2 -->
        <div
          class="flex flex-col items-center p-6 bg-gray-900 rounded-lg shadow-lg"
        >
          <img
            src={jnice}
            alt="Team Member 2"
            class="w-32 h-32 mb-4 rounded-full object-cover"
          />
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Amara D. James
          </h3>
          <p class="text-gray-300 text-center">
            Product Manager with a knack for user experience design and project
            management in tech startups.
          </p>
        </div>

        <!-- Team Member 3 -->
        <div
          class="flex flex-col items-center p-6 bg-gray-900 rounded-lg shadow-lg"
        >
          <img
            src={michael}
            alt="Team Member 3"
            class="w-32 h-32 mb-4 rounded-full object-cover"
          />
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            Michael S.O.S Johnson
          </h3>
          <p class="text-gray-300 text-center">
            Lead Developer with over 5 years of experience in  web development/software development.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- // login modal -->
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
              {#if errorMessage !== null}<span
                  in:fade
                  class="text-center text-red-500 text-sm px-2"
                  >{errorMessage}</span
                >{:else}<span class="text-center text-sm px-2"
                  >Or use your email account</span
                >{/if}

              <hr
                class=" w-1/5 h-1 my-8 bg-gray-300 border-0 rounded dark:bg-gray-700"
              />
            </div>
            <!-- login form -->
            <div class="text-left">
              <div class="mb-3">
                <label for="email" class="block mb-2 text-sm font-medium"
                  >Email address</label
                >
                <input
                  bind:value={email}
                  type="email"
                  id="email"
                  name="email"
                  class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="password" class="block mb-2 text-sm font-medium"
                  >Password</label
                >
                <input
                  bind:value={password}
                  type="password"
                  name="password"
                  id="password"
                  class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="•••••••••"
                  required
                />
              </div>

              <div class="flex justify-between mb-3">
                <div class="flex">
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
                    >Remember Me.</label
                  >
                </div>
                <div>
                  <a class="text-yellow-300 hover:text-yellow-400" href="/#/"
                    >Forgot Password ?
                  </a>
                </div>
              </div>
              <!-- login button -->
              <button
                {disabled}
                on:click|preventDefault|stopPropagation={loginBtnClicked}
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
              <!-- login button ends -->
            </div>
            <!-- login form -->
            <div
              class=" capitalize m-3 grid md:grid-cols-2 sm:grid-cols-1 gap-1"
            >
              <div class=" md:text-right sm:text-center">
                <span>don't have an account?</span>
              </div>
              <div class=" md:text-left sm:text-center">
                <a
                  on:click|preventDefault|stopPropagation={() => {
                    login = false;
                    let time = setTimeout(() => {
                      signup = true;
                      clearTimeout(time);
                    }, 1000);
                  }}
                  href="/#/"
                  class="text-white hover:text-yellow-400 border border-yellow-400 hover:bg-white focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-1 text-center m-0"
                  >create an account now</a
                >
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  {/if}
  <!-- // login modal ends  -->

  <!-- // signup Modal -->
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
            {#if errorMessage !== null}<span
                in:fade
                class="text-center text-red-500 text-sm px-2"
                >{errorMessage}</span
              >{:else}
              <h2 class="fontText text-3xl text-yellow-300">
                Create with Social Profile
              </h2>
            {/if}

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
  <!-- // signup Modal Ends-->
</div>

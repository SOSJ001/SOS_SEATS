<script>
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { signOutbtnFunction } from "$lib/supabase";
  $:activeUrl = $page.url.pathname;
  let routes = [
    { icon: "🏠", name: "Home", url: "/" },
    { icon: "🧾", name: "Events", url: "/dashboard" },
    { icon: "🙋‍♂️", name: "Guests", url: "/dashboard/guests" },
    { icon: "🪑", name: "Seats", url: "/dashboard/seats" },
    { icon: "💳", name: "Wallet", url: "/dashboard/wallet" },

  ];
  let logout = async () => {
    await signOutbtnFunction();
    const response = await fetch("/logoutApi", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    invalidateAll();
  };
</script>

<div
  class="md:flex grow flex-col overflow-hidden bg-gray-800 px-6 w-64 h-screen hidden"
>
  <nav class="flex flex-1 flex-col mt-16">
    <div class="flex items-center mt-5 mb-5 rounded-full">
      <hr class="w-5 h-1 bg-yellow-400 border-0" />
      <hr class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded" />
      <hr class="w-5 h-1 bg-yellow-400 border-0" />
      <!-- <hr class="w-8 h-8 mx-auto my-8 bg-gray-200 border-0 rounded  "> -->
      <hr class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded" />
      <hr class="w-5 h-1 bg-yellow-400 border-0" />
    </div>
    <div class="h-full px-3 pb-4 overflow-y-auto bg-dark space-y-5">
      {#each routes as route}
        <a
          href={route.url}
          class="{activeUrl === route.url
            ? 'bg-yellow-500'
            : ''} flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
        >
          <span class="text-2xl">{route.icon}</span>
          <span class="ml-3">{route.name}</span>
        </a>
      {/each}
      <button
      on:click={logout}
        class="w-full flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
      >
        <span class="text-2xl">🚩</span>
        <span class="ml-3">Logout</span>
      </button>
    </div>
  </nav>
</div>

<script lang="ts">
  import Toast from "./Toast.svelte";

  let showSuccessToast = false;
  let showErrorToast = false;
  let showWarningToast = false;
  let showInfoToast = false;
  let showCustomToast = false;

  function showToast(type: "success" | "error" | "warning" | "info") {
    switch (type) {
      case "success":
        showSuccessToast = true;
        break;
      case "error":
        showErrorToast = true;
        break;
      case "warning":
        showWarningToast = true;
        break;
      case "info":
        showInfoToast = true;
        break;
    }
  }

  function showCustom() {
    showCustomToast = true;
  }
</script>

<div class="p-8 space-y-4">
  <h2 class="text-2xl font-bold text-white mb-6">Toast Component Demo</h2>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <button
      on:click={() => showToast("success")}
      class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
    >
      Success Toast
    </button>

    <button
      on:click={() => showToast("error")}
      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
    >
      Error Toast
    </button>

    <button
      on:click={() => showToast("warning")}
      class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
    >
      Warning Toast
    </button>

    <button
      on:click={() => showToast("info")}
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
    >
      Info Toast
    </button>
  </div>

  <button
    on:click={showCustom}
    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
  >
    Custom Toast
  </button>
</div>

<!-- Success Toast -->
<Toast
  bind:show={showSuccessToast}
  type="success"
  position="top-right"
  duration={4000}
>
  <svelte:fragment slot="title">Success!</svelte:fragment>
  <svelte:fragment slot="description">
    Your wallet has been connected successfully.
  </svelte:fragment>
</Toast>

<!-- Error Toast -->
<Toast
  bind:show={showErrorToast}
  type="error"
  position="top-right"
  duration={5000}
>
  <svelte:fragment slot="title">Connection Failed</svelte:fragment>
  <svelte:fragment slot="description">
    Unable to connect to wallet. Please try again.
  </svelte:fragment>
</Toast>

<!-- Warning Toast -->
<Toast
  bind:show={showWarningToast}
  type="warning"
  position="top-right"
  duration={6000}
>
  <svelte:fragment slot="title">Wallet Disconnected</svelte:fragment>
  <svelte:fragment slot="description">
    Wallet was disconnected because username setup was cancelled.
  </svelte:fragment>
</Toast>

<!-- Info Toast -->
<Toast
  bind:show={showInfoToast}
  type="info"
  position="top-right"
  duration={3000}
>
  <svelte:fragment slot="title">Information</svelte:fragment>
  <svelte:fragment slot="description">
    Please complete your profile setup to continue.
  </svelte:fragment>
</Toast>

<!-- Custom Toast -->
<Toast
  bind:show={showCustomToast}
  type="success"
  position="bottom-center"
  duration={8000}
>
  <svelte:fragment slot="icon">
    <div
      class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
    >
      <svg
        class="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        ></path>
      </svg>
    </div>
  </svelte:fragment>
  <svelte:fragment slot="title">Custom Notification</svelte:fragment>
  <svelte:fragment slot="description">
    This is a custom toast with a lightning bolt icon and longer duration.
  </svelte:fragment>
</Toast>

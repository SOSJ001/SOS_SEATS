<script>
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import GeneralSettings from "$lib/components/GeneralSettings.svelte";
  import ProfileSettings from "$lib/components/ProfileSettings.svelte";
  import Web3Settings from "$lib/components/Web3Settings.svelte";
  import NotificationSettings from "$lib/components/NotificationSettings.svelte";
  import SecuritySettings from "$lib/components/SecuritySettings.svelte";

  // Settings data
  let settings = {
    general: {
      language: "English",
      timezone: "UTC-5 (Eastern Time)",
      currency: "USD",
    },
    profile: {
      username: "john.doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
    },
    web3: {
      wallet: "0xAbc...123",
      network: "Polygon Mainnet",
      gasFee: "Standard",
      connected: true,
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  };

  let hasChanges = false;
  let originalSettings = {};

  onMount(() => {
    // Store original settings for comparison
    originalSettings = JSON.parse(JSON.stringify(settings));
  });

  function handleInputChange() {
    hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }

  function saveChanges() {
    // Here you would typically save to backend
    originalSettings = JSON.parse(JSON.stringify(settings));
    hasChanges = false;
    // Show success message
  }

  function cancelChanges() {
    settings = JSON.parse(JSON.stringify(originalSettings));
    hasChanges = false;
  }

  function disconnectWallet() {
    settings.web3.connected = false;
    settings.web3.wallet = "";
    handleInputChange();
  }

  function handlePasswordChange() {
    // Handle password change modal/form
    console.log("Password change requested");
  }

  function handle2FASetup() {
    // Handle 2FA setup modal/form
    console.log("2FA setup requested");
  }

  function handleDeviceManagement() {
    // Handle device management modal/page
    console.log("Device management requested");
  }
</script>

<div class="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
  <!-- Header -->
  <div
    class="mb-6 sm:mb-8"
    in:fly={{ y: -20, duration: 600, easing: quintOut }}
  >
    <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
    <p class="text-gray-400 text-sm sm:text-base">
      Manage your account preferences and security settings
    </p>
  </div>

  <!-- Settings Sections -->
  <div class="space-y-4 sm:space-y-6 max-w-4xl">
    <!-- General Section -->
    <div in:fade={{ duration: 400, delay: 100 }}>
      <GeneralSettings {settings} onInputChange={handleInputChange} />
    </div>

    <!-- Profile Section -->
    <div in:fade={{ duration: 400, delay: 200 }}>
      <ProfileSettings {settings} onInputChange={handleInputChange} />
    </div>

    <!-- Web3 Settings Section -->
    <div in:fade={{ duration: 400, delay: 300 }}>
      <Web3Settings
        {settings}
        onInputChange={handleInputChange}
        onDisconnectWallet={disconnectWallet}
      />
    </div>

    <!-- Notifications Section -->
    <div in:fade={{ duration: 400, delay: 400 }}>
      <NotificationSettings {settings} onInputChange={handleInputChange} />
    </div>

    <!-- Security Section -->
    <div in:fade={{ duration: 400, delay: 500 }}>
      <SecuritySettings
        onPasswordChange={handlePasswordChange}
        on2FASetup={handle2FASetup}
        onDeviceManagement={handleDeviceManagement}
      />
    </div>
  </div>

  <!-- Action Buttons - Mobile Responsive -->
  <div
    class="fixed bottom-4 sm:bottom-6 left-4 sm:left-auto sm:right-6 right-4 flex space-x-2 sm:space-x-3 z-50"
    in:fly={{ y: 20, duration: 400, delay: 600 }}
  >
    <button
      on:click={cancelChanges}
      disabled={!hasChanges}
      class="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
    >
      Cancel
    </button>
    <button
      on:click={saveChanges}
      disabled={!hasChanges}
      class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-500 text-white px-4 sm:px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
    >
      Save Changes
    </button>
  </div>

  <!-- Bottom spacing for mobile to account for fixed buttons -->
  <div class="h-20 sm:h-0"></div>
</div>

<style>
  /* Custom scrollbar for webkit browsers */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #374151;
  }

  ::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>

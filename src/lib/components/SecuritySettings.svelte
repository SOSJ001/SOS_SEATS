<script>
  export let onPasswordChange;
  export let on2FASetup;
  export let onDeviceManagement;
</script>

<div class="bg-gray-800 rounded-lg p-4 sm:p-6">
  <h2
    class="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center"
  >
    <svg
      class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      ></path>
    </svg>
    Security
  </h2>

  <div class="space-y-3 sm:space-y-4">
    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700"
    >
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0"
        >Change Password</span
      >
      <button
        on:click={onPasswordChange}
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors w-full sm:w-auto"
      >
        Change
      </button>
    </div>

    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700"
    >
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0"
        >Two-Factor Authentication</span
      >
      <button
        on:click={on2FASetup}
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors w-full sm:w-auto"
      >
        Setup
      </button>
    </div>

    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3"
    >
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0"
        >Connected Devices</span
      >
      <button
        on:click={onDeviceManagement}
        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors w-full sm:w-auto"
      >
        Manage
      </button>
    </div>
  </div>
</div>

<script>
  export let settings;
  export let onInputChange;
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
        d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 006 3h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
      ></path>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 9h.01M15 9h.01M9 13h6"
      ></path>
    </svg>
    Notifications
  </h2>

  <div class="space-y-3 sm:space-y-4">
    <div
      class="flex justify-between items-center py-3 border-b border-gray-700"
    >
      <span class="text-gray-300 text-sm sm:text-base">Email Notifications</span
      >
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={settings.notifications.email}
          on:change={onInputChange}
          class="sr-only peer"
        />
        <div
          class="w-10 h-6 sm:w-11 sm:h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
        ></div>
      </label>
    </div>

    <div
      class="flex justify-between items-center py-3 border-b border-gray-700"
    >
      <span class="text-gray-300 text-sm sm:text-base">Push Notifications</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={settings.notifications.push}
          on:change={onInputChange}
          class="sr-only peer"
        />
        <div
          class="w-10 h-6 sm:w-11 sm:h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
        ></div>
      </label>
    </div>

    <div class="flex justify-between items-center py-3">
      <span class="text-gray-300 text-sm sm:text-base">SMS Alerts</span>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          bind:checked={settings.notifications.sms}
          on:change={onInputChange}
          class="sr-only peer"
        />
        <div
          class="w-10 h-6 sm:w-11 sm:h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
        ></div>
      </label>
    </div>
  </div>
</div>

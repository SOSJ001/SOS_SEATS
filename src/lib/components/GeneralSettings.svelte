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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      ></path>
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      ></path>
    </svg>
    General
  </h2>

  <div class="space-y-3 sm:space-y-4">
    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700"
    >
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0"
        >App Language</span
      >
      <select
        bind:value={settings.general.language}
        on:change={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
      >
        <option value="English">English</option>
        <option value="Spanish">Spanish</option>
        <option value="French">French</option>
        <option value="German">German</option>
      </select>
    </div>

    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700"
    >
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0"
        >Timezone</span
      >
      <select
        bind:value={settings.general.timezone}
        on:change={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
      >
        <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
        <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
        <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
        <option value="UTC+1 (Central European)"
          >UTC+1 (Central European)</option
        >
      </select>
    </div>

    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3"
    >
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0"
        >Currency</span
      >
      <select
        bind:value={settings.general.currency}
        on:change={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
      >
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="JPY">JPY</option>
      </select>
    </div>
  </div>
</div>

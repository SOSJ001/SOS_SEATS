<script>
  export let settings;
  export let onInputChange;
</script>

<div class="bg-gray-800 rounded-lg p-4 sm:p-6">
  <h2 class="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center">
    <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>
    Profile
  </h2>
  
  <div class="space-y-3 sm:space-y-4">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Username</span>
      <input 
        type="text" 
        bind:value={settings.profile.username} 
        on:input={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-48"
      />
    </div>
    
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-700">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Email Address</span>
      <input 
        type="email" 
        bind:value={settings.profile.email} 
        on:input={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-64"
      />
    </div>
    
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3">
      <span class="text-gray-300 text-sm sm:text-base mb-2 sm:mb-0">Phone Number</span>
      <input 
        type="tel" 
        bind:value={settings.profile.phone} 
        on:input={onInputChange}
        class="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm sm:text-base w-full sm:w-48"
      />
    </div>
  </div>
</div>

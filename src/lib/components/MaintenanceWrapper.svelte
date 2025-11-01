<script lang="ts">
  export let isUnderMaintenance: boolean = false;
  export let message: string = "This section is currently under maintenance";
  export let showIcon: boolean = true;
  export let variant: "default" | "minimal" | "full" = "default";
  export let disableContent: boolean = false; // If true, shows content but disabled. If false, hides content completely.
</script>

{#if isUnderMaintenance && !disableContent}
  <!-- Hide content completely, show maintenance message -->
  <div
    class="relative w-full {variant === 'full'
      ? 'rounded-xl border-2 border-yellow-500/50 bg-gray-800/90 p-4 sm:p-6 md:p-8'
      : variant === 'minimal'
        ? 'rounded-lg border border-yellow-500/30 bg-gray-800/80 p-3 sm:p-4'
        : 'rounded-lg border border-yellow-500/40 bg-gray-800/90 p-4 sm:p-5 md:p-6'}"
  >
    <div
      class="flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 md:space-y-4"
    >
      {#if showIcon}
        <div
          class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 {variant ===
          'full'
            ? 'mb-2'
            : ''}"
        >
          <svg
            class="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-400 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      {/if}

      <div class="space-y-1 sm:space-y-2 px-2 sm:px-0">
        <h3
          class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-400 {variant ===
          'minimal'
            ? 'text-sm sm:text-base md:text-lg'
            : ''}"
        >
          {variant === "full"
            ? "Under Maintenance"
            : variant === "minimal"
              ? "Maintenance"
              : "Under Maintenance"}
        </h3>
        <p
          class="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 max-w-md mx-auto px-2 sm:px-0 {variant ===
          'minimal'
            ? 'text-[11px] sm:text-xs md:text-sm'
            : ''}"
        >
          {message}
        </p>
        {#if variant === "full"}
          <p class="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2 px-2 sm:px-0">
            We're working hard to improve this feature. Please check back soon.
          </p>
        {/if}
      </div>

      {#if variant === "full"}
        <div class="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 px-2 sm:px-0">
          <div class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></div>
          <span class="text-[10px] sm:text-xs md:text-sm text-gray-400"
            >Estimated completion: Soon</span
          >
        </div>
      {/if}
    </div>
  </div>
{:else if isUnderMaintenance && disableContent}
  <!-- Show content but disabled, with maintenance overlay -->
  <div class="relative w-full">
    <!-- Disabled content -->
    <div class="opacity-50 pointer-events-none">
      <slot />
    </div>
    <!-- Maintenance overlay -->
    <div
      class="absolute inset-0 flex items-center justify-center {variant === 'full'
        ? 'rounded-xl border-2 border-yellow-500/50 bg-gray-800/90 p-4 sm:p-6 md:p-8'
        : variant === 'minimal'
          ? 'rounded-lg border border-yellow-500/30 bg-gray-800/80 p-3 sm:p-4'
          : 'rounded-lg border border-yellow-500/40 bg-gray-800/90 p-4 sm:p-5 md:p-6'}"
    >
      <div
        class="flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 md:space-y-4"
      >
        {#if showIcon}
          <div
            class="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0"
          >
            <svg
              class="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        {/if}
        <div class="space-y-1 sm:space-y-2 px-2 sm:px-0">
          <p
            class="text-xs sm:text-sm md:text-base text-yellow-400 font-semibold {variant ===
            'minimal'
              ? 'text-[10px] sm:text-xs'
              : ''}"
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Normal content display -->
  <slot />
{/if}

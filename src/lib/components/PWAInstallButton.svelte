<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";

  let installPrompt: BeforeInstallPromptEvent | null = null;
  let showButton = false;
  let isInstalled = false;

  onMount(() => {
    // Only run on client side (browser)
    if (typeof window === "undefined" || !browser) return;

    // Check if already installed - don't show button if installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      isInstalled = true;
      showButton = false;
      return;
    }

    // Check if running as installed app (additional check for iOS Safari)
    if ((window.navigator as any).standalone === true) {
      isInstalled = true;
      showButton = false;
      return;
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    // This event fires when PWA meets installability criteria
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent default browser install prompt
      installPrompt = e as BeforeInstallPromptEvent;
      showButton = true;
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );

    // Check if app is already installed
    const handleAppInstalled = () => {
      isInstalled = true;
      showButton = false;
      installPrompt = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  });

  function handleInstallClick() {
    // If we have the install prompt, trigger it immediately
    if (installPrompt) {
      installPrompt.prompt();

      // Handle user's choice
      installPrompt.userChoice.then(
        (choiceResult: { outcome: "accepted" | "dismissed" }) => {
          if (choiceResult.outcome === "accepted") {
            isInstalled = true;
            showButton = false;
          }
          installPrompt = null;
        }
      );
    }
  }

  function dismissButton() {
    // Dismiss for current session only - will reshow on browser refresh
    showButton = false;
  }
</script>

{#if browser && showButton && !isInstalled && installPrompt}
  <div class="fixed bottom-8 left-8 z-[10000]">
    <div class="relative group">
      <!-- Main Install Button -->
      <button
        on:click={handleInstallClick}
        class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] shadow-2xl hover:shadow-[#00F5FF]/50 transition-all duration-300 flex items-center justify-center group/btn hover:scale-110 active:scale-95 border-2 border-white/20 backdrop-blur-sm"
        aria-label="Install SOS SEATS app"
        title="Install app on your device"
      >
        <!-- Icon -->
        <svg
          class="w-8 h-8 sm:w-10 sm:h-10 text-white transition-transform duration-300 group-hover/btn:rotate-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01"
          />
        </svg>

        <!-- Pulse animation -->
        <span
          class="absolute inset-0 rounded-full bg-gradient-to-br from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] animate-ping opacity-20"
        ></span>

        <!-- Tooltip on hover -->
        <div
          class="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-gray-700"
        >
          Install App
          <div
            class="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          ></div>
        </div>
      </button>

      <!-- Dismiss Button -->
      <button
        on:click|stopPropagation={dismissButton}
        class="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 border border-gray-700 z-10"
        aria-label="Dismiss install button"
        title="Don't show again"
      >
        <svg
          class="w-3 h-3 sm:w-4 sm:h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes ping {
    75%,
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }

  .animate-ping {
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
</style>

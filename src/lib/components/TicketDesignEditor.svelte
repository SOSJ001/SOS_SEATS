<script lang="ts">
  import {
    defaultTicketDesignConfig,
    type TicketDesignConfig,
  } from "$lib/store";
  import { generateTicketPreview } from "$lib/store";

  export let designConfig: TicketDesignConfig = defaultTicketDesignConfig;
  export let eventData: any = null;
  export let onConfigChange: (config: TicketDesignConfig) => void = () => {};

  let previewUrl: string | null = null;
  let generatingPreview = false;
  let isCollapsed = false;

  // Reactive statement to generate preview when config changes
  $: if (eventData && designConfig) {
    generatePreview();
  }

  async function generatePreview() {
    if (!eventData) return;

    generatingPreview = true;
    try {
      const url = await generateTicketPreview({
        eventName: eventData.name,
        eventDate: eventData.date,
        eventTime: eventData.time,
        eventLocation: eventData.location,
        eventImage: eventData.image_url,
        ticketTypeName: "VIP",
        ticketPrice: "Free",
        guestName: "Michael S.O.S",
        organizer: eventData.organizer_name,
        designConfig: designConfig,
      });
      previewUrl = url;
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      generatingPreview = false;
    }
  }

  function updateConfig(updates: Partial<TicketDesignConfig>) {
    const newConfig = { ...designConfig, ...updates };
    designConfig = newConfig;
    onConfigChange(newConfig);
  }

  function updateCanvasSize(width: number, height: number) {
    updateConfig({
      canvas: { ...designConfig.canvas, width, height },
    });
  }

  function updateQrCodeSize(size: number) {
    updateConfig({
      qrCode: { ...designConfig.qrCode, size },
    });
  }

  function updateQrCodePosition(
    x: "left" | "center" | "right",
    y: "top" | "center" | "bottom"
  ) {
    updateConfig({
      qrCode: {
        ...designConfig.qrCode,
        position: { ...designConfig.qrCode.position, x, y },
      },
    });
  }

  function updateColor(
    type: keyof TicketDesignConfig["colors"],
    color: string
  ) {
    updateConfig({
      colors: { ...designConfig.colors, [type]: color },
    });
  }

  function updateFontSize(
    type: keyof TicketDesignConfig["fonts"],
    size: number
  ) {
    updateConfig({
      fonts: {
        ...designConfig.fonts,
        [type]: { ...designConfig.fonts[type], size },
      },
    });
  }

  function updateFontWeight(
    type: keyof TicketDesignConfig["fonts"],
    weight: "normal" | "bold"
  ) {
    updateConfig({
      fonts: {
        ...designConfig.fonts,
        [type]: { ...designConfig.fonts[type], weight },
      },
    });
  }

  function resetToDefault() {
    designConfig = defaultTicketDesignConfig;
    onConfigChange(designConfig);
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }
</script>

<div
  class="md:grid flex flex-col lg:flex-row gap-4 lg:gap-8 p-3 sm:p-4 lg:p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-7xl mx-auto"
>
  <div
    class="flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-start lg:items-start xl:items-start gap-4 lg:gap-6 mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-700"
  >
    <div class="flex-1">
      <div class="flex items-center justify-between mb-2">
        <h3
          class="text-xl sm:text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          Ticket Design Editor
        </h3>
        <button
          on:click={toggleCollapse}
          class="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex-shrink-0"
        >
          <svg
            class="w-4 h-4 transition-transform duration-200 {isCollapsed
              ? 'rotate-180'
              : ''}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
          {isCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      <p class="text-gray-400 text-sm lg:text-base leading-relaxed max-w-md">
        Tune colors, fonts, positions, and layout. Changes reflect instantly in
        the live preview.
      </p>
    </div>
    <button
      on:click={resetToDefault}
      class="flex items-center justify-center gap-2 px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/25 flex-shrink-0 w-full sm:w-auto"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        ></path>
      </svg>
      Reset to Default
    </button>
  </div>

  <div class="flex-1 max-w-none lg:max-w-lg xl:max-w-xl">
    <!-- Configuration Sections (Collapsible) -->
    <div
      class="transition-all duration-300 ease-in-out overflow-hidden {isCollapsed
        ? 'max-h-0 opacity-0'
        : 'max-h-none opacity-100'}"
    >
      <!-- Canvas Settings -->
      <div
        class="mb-6 lg:mb-8 p-4 lg:p-6 bg-gray-800/90 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg"
      >
        <div class="flex items-center justify-between mb-4 lg:mb-6">
          <h4
            class="text-cyan-400 text-base lg:text-lg font-semibold flex items-center gap-2"
          >
            Canvas Size
          </h4>
          <div
            class="text-lg opacity-80 drop-shadow-[0_0_4px_rgba(0,245,255,0.3)]"
          >
            📐
          </div>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-2">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Width</span
              >
              <div
                class="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all"
              >
                <input
                  type="number"
                  bind:value={designConfig.canvas.width}
                  on:input={() =>
                    updateCanvasSize(
                      designConfig.canvas.width,
                      designConfig.canvas.height
                    )}
                  min="200"
                  max="800"
                  class="bg-transparent border-none text-white p-3 text-sm flex-1 outline-none"
                />
                <span
                  class="px-3 py-3 bg-gray-600 text-gray-300 text-xs font-medium"
                  >px</span
                >
              </div>
            </label>
            <label class="flex flex-col gap-2">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Height</span
              >
              <div
                class="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all"
              >
                <input
                  type="number"
                  bind:value={designConfig.canvas.height}
                  on:input={() =>
                    updateCanvasSize(
                      designConfig.canvas.width,
                      designConfig.canvas.height
                    )}
                  min="300"
                  max="1000"
                  class="bg-transparent border-none text-white p-3 text-sm flex-1 outline-none"
                />
                <span
                  class="px-3 py-3 bg-gray-600 text-gray-300 text-xs font-medium"
                  >px</span
                >
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- QR Code Settings -->
      <div
        class="mb-6 lg:mb-8 p-4 lg:p-6 bg-gray-800/90 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg"
      >
        <div class="flex items-center justify-between mb-4 lg:mb-6">
          <h4
            class="text-cyan-400 text-base lg:text-lg font-semibold flex items-center gap-2"
          >
            QR Code
          </h4>
          <div
            class="text-lg opacity-80 drop-shadow-[0_0_4px_rgba(0,245,255,0.3)]"
          >
            📱
          </div>
        </div>
        <div class="space-y-4">
          <label class="flex flex-col gap-3">
            <span class="text-gray-300 text-sm font-medium">Size</span>
            <div class="flex items-center gap-4">
              <input
                type="range"
                min="60"
                max="150"
                bind:value={designConfig.qrCode.size}
                on:input={() => updateQrCodeSize(designConfig.qrCode.size)}
                class="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span
                class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-4 py-2 rounded-lg text-sm font-semibold min-w-[60px] text-center border border-gray-500 shadow-md"
              >
                {designConfig.qrCode.size}px
              </span>
            </div>
          </label>
          <div class="space-y-6">
            <div class="space-y-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Position X</span
              >
              <div class="flex gap-2">
                <button
                  class="flex-1 px-4 py-2 rounded-md text-sm transition-all duration-200 {designConfig
                    .qrCode.position.x === 'left'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-400 shadow-md shadow-cyan-400/30'
                    : 'bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-500 hover:border-gray-400'}"
                  on:click={() =>
                    updateQrCodePosition(
                      "left",
                      designConfig.qrCode.position.y
                    )}
                >
                  Left
                </button>
                <button
                  class="flex-1 px-4 py-2 rounded-md text-sm transition-all duration-200 {designConfig
                    .qrCode.position.x === 'center'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-400 shadow-md shadow-cyan-400/30'
                    : 'bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-500 hover:border-gray-400'}"
                  on:click={() =>
                    updateQrCodePosition(
                      "center",
                      designConfig.qrCode.position.y
                    )}
                >
                  Center
                </button>
                <button
                  class="flex-1 px-4 py-2 rounded-md text-sm transition-all duration-200 {designConfig
                    .qrCode.position.x === 'right'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-400 shadow-md shadow-cyan-400/30'
                    : 'bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-500 hover:border-gray-400'}"
                  on:click={() =>
                    updateQrCodePosition(
                      "right",
                      designConfig.qrCode.position.y
                    )}
                >
                  Right
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Position Y</span
              >
              <div class="flex gap-2">
                <button
                  class="flex-1 px-4 py-2 rounded-md text-sm transition-all duration-200 {designConfig
                    .qrCode.position.y === 'top'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-400 shadow-md shadow-cyan-400/30'
                    : 'bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-500 hover:border-gray-400'}"
                  on:click={() =>
                    updateQrCodePosition(designConfig.qrCode.position.x, "top")}
                >
                  Top
                </button>
                <button
                  class="flex-1 px-4 py-2 rounded-md text-sm transition-all duration-200 {designConfig
                    .qrCode.position.y === 'center'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-400 shadow-md shadow-cyan-400/30'
                    : 'bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-500 hover:border-gray-400'}"
                  on:click={() =>
                    updateQrCodePosition(
                      designConfig.qrCode.position.x,
                      "center"
                    )}
                >
                  Center
                </button>
                <button
                  class="flex-1 px-4 py-2 rounded-md text-sm transition-all duration-200 {designConfig
                    .qrCode.position.y === 'bottom'
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border border-cyan-400 shadow-md shadow-cyan-400/30'
                    : 'bg-gray-600 text-gray-300 border border-gray-500 hover:bg-gray-500 hover:border-gray-400'}"
                  on:click={() =>
                    updateQrCodePosition(
                      designConfig.qrCode.position.x,
                      "bottom"
                    )}
                >
                  Bottom
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Text Colors -->
      <div
        class="mb-6 lg:mb-8 p-4 lg:p-6 bg-gray-800/90 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg"
      >
        <div class="flex items-center justify-between mb-4 lg:mb-6">
          <h4
            class="text-cyan-400 text-base lg:text-lg font-semibold flex items-center gap-2"
          >
            Text Colors
          </h4>
          <div
            class="text-lg opacity-80 drop-shadow-[0_0_4px_rgba(0,245,255,0.3)]"
          >
            🎨
          </div>
        </div>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
        >
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Primary Name</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="color"
                  bind:value={designConfig.colors.primaryName}
                  on:input={() =>
                    updateColor("primaryName", designConfig.colors.primaryName)}
                  class="w-10 h-10 sm:w-12 sm:h-12 border-none rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md min-w-[70px] sm:min-w-[80px] text-center truncate"
                >
                  {designConfig.colors.primaryName}
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Event Name</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="color"
                  bind:value={designConfig.colors.eventName}
                  on:input={() =>
                    updateColor("eventName", designConfig.colors.eventName)}
                  class="w-10 h-10 sm:w-12 sm:h-12 border-none rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md min-w-[70px] sm:min-w-[80px] text-center truncate"
                >
                  {designConfig.colors.eventName}
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Date/Time</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="color"
                  bind:value={designConfig.colors.dateTime}
                  on:input={() =>
                    updateColor("dateTime", designConfig.colors.dateTime)}
                  class="w-10 h-10 sm:w-12 sm:h-12 border-none rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md min-w-[70px] sm:min-w-[80px] text-center truncate"
                >
                  {designConfig.colors.dateTime}
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Location</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="color"
                  bind:value={designConfig.colors.location}
                  on:input={() =>
                    updateColor("location", designConfig.colors.location)}
                  class="w-10 h-10 sm:w-12 sm:h-12 border-none rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md min-w-[70px] sm:min-w-[80px] text-center truncate"
                >
                  {designConfig.colors.location}
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Ticket Type</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="color"
                  bind:value={designConfig.colors.ticketType}
                  on:input={() =>
                    updateColor("ticketType", designConfig.colors.ticketType)}
                  class="w-10 h-10 sm:w-12 sm:h-12 border-none rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md min-w-[70px] sm:min-w-[80px] text-center truncate"
                >
                  {designConfig.colors.ticketType}
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Ticket Number</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="color"
                  bind:value={designConfig.colors.ticketNumber}
                  on:input={() =>
                    updateColor(
                      "ticketNumber",
                      designConfig.colors.ticketNumber
                    )}
                  class="w-10 h-10 sm:w-12 sm:h-12 border-none rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md min-w-[70px] sm:min-w-[80px] text-center truncate"
                >
                  {designConfig.colors.ticketNumber}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Font Sizes -->
      <div
        class="mb-6 lg:mb-8 p-4 lg:p-6 bg-gray-800/90 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg"
      >
        <div class="flex items-center justify-between mb-4 lg:mb-6">
          <h4
            class="text-cyan-400 text-base lg:text-lg font-semibold flex items-center gap-2"
          >
            Font Sizes
          </h4>
          <div
            class="text-lg opacity-80 drop-shadow-[0_0_4px_rgba(0,245,255,0.3)]"
          >
            🔤
          </div>
        </div>
        <div class="space-y-4">
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Primary Name</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="16"
                  max="40"
                  bind:value={designConfig.fonts.primaryName.size}
                  on:input={() =>
                    updateFontSize(
                      "primaryName",
                      designConfig.fonts.primaryName.size
                    )}
                  class="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold min-w-[50px] sm:min-w-[60px] text-center border border-gray-500 shadow-md"
                >
                  {designConfig.fonts.primaryName.size}px
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Event Name</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="12"
                  max="30"
                  bind:value={designConfig.fonts.eventName.size}
                  on:input={() =>
                    updateFontSize(
                      "eventName",
                      designConfig.fonts.eventName.size
                    )}
                  class="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold min-w-[50px] sm:min-w-[60px] text-center border border-gray-500 shadow-md"
                >
                  {designConfig.fonts.eventName.size}px
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Date/Time</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="10"
                  max="24"
                  bind:value={designConfig.fonts.dateTime.size}
                  on:input={() =>
                    updateFontSize(
                      "dateTime",
                      designConfig.fonts.dateTime.size
                    )}
                  class="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold min-w-[50px] sm:min-w-[60px] text-center border border-gray-500 shadow-md"
                >
                  {designConfig.fonts.dateTime.size}px
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Location</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="10"
                  max="20"
                  bind:value={designConfig.fonts.location.size}
                  on:input={() =>
                    updateFontSize(
                      "location",
                      designConfig.fonts.location.size
                    )}
                  class="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold min-w-[50px] sm:min-w-[60px] text-center border border-gray-500 shadow-md"
                >
                  {designConfig.fonts.location.size}px
                </span>
              </div>
            </label>
          </div>
          <div
            class="bg-gray-700/60 rounded-lg p-3 sm:p-4 border border-gray-500 hover:bg-gray-700/80 hover:border-gray-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            <label class="flex flex-col gap-2 sm:gap-3">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Ticket Type</span
              >
              <div class="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="12"
                  max="28"
                  bind:value={designConfig.fonts.ticketType.size}
                  on:input={() =>
                    updateFontSize(
                      "ticketType",
                      designConfig.fonts.ticketType.size
                    )}
                  class="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <span
                  class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold min-w-[50px] sm:min-w-[60px] text-center border border-gray-500 shadow-md"
                >
                  {designConfig.fonts.ticketType.size}px
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Text Box Settings -->
      <div
        class="mb-6 lg:mb-8 p-4 lg:p-6 bg-gray-800/90 rounded-xl border border-gray-600 hover:border-gray-500 transition-all duration-300 hover:shadow-lg"
      >
        <div class="flex items-center justify-between mb-4 lg:mb-6">
          <h4
            class="text-cyan-400 text-base lg:text-lg font-semibold flex items-center gap-2"
          >
            Text Box
          </h4>
          <div
            class="text-lg opacity-80 drop-shadow-[0_0_4px_rgba(0,245,255,0.3)]"
          >
            📝
          </div>
        </div>
        <div class="space-y-4">
          <!-- Enable Text Box Checkbox -->
          <div
            class="bg-gradient-to-r from-gray-700/80 to-gray-600/80 rounded-lg border border-cyan-400/30 p-4"
          >
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={designConfig.textBox.enabled}
                on:change={() =>
                  updateConfig({
                    textBox: {
                      ...designConfig.textBox,
                      enabled: designConfig.textBox.enabled,
                    },
                  })}
                class="w-5 h-5 accent-cyan-400 rounded"
              />
              <div class="flex-1">
                <span class="text-white text-sm font-semibold"
                  >Show Text Content</span
                >
                <p class="text-gray-400 text-xs mt-1">
                  {designConfig.textBox.enabled
                    ? "All text content (names, dates, etc.) is visible on the ticket"
                    : "All text content is hidden - only QR code and background image show"}
                </p>
              </div>
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-2">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Position X</span
              >
              <div
                class="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all"
              >
                <input
                  type="number"
                  bind:value={designConfig.textBox.position.x}
                  on:input={() =>
                    updateConfig({
                      textBox: {
                        ...designConfig.textBox,
                        position: {
                          ...designConfig.textBox.position,
                          x: designConfig.textBox.position.x,
                        },
                      },
                    })}
                  min="0"
                  max="200"
                  class="bg-transparent border-none text-white p-3 text-sm flex-1 outline-none"
                />
                <span
                  class="px-3 py-3 bg-gray-600 text-gray-300 text-xs font-medium"
                  >px</span
                >
              </div>
            </label>
            <label class="flex flex-col gap-2">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Position Y</span
              >
              <div
                class="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all"
              >
                <input
                  type="number"
                  bind:value={designConfig.textBox.position.y}
                  on:input={() =>
                    updateConfig({
                      textBox: {
                        ...designConfig.textBox,
                        position: {
                          ...designConfig.textBox.position,
                          y: designConfig.textBox.position.y,
                        },
                      },
                    })}
                  min="0"
                  max="200"
                  class="bg-transparent border-none text-white p-3 text-sm flex-1 outline-none"
                />
                <span
                  class="px-3 py-3 bg-gray-600 text-gray-300 text-xs font-medium"
                  >px</span
                >
              </div>
            </label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label class="flex flex-col gap-2">
              <span class="text-gray-300 text-xs sm:text-sm font-medium"
                >Height</span
              >
              <div
                class="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all"
              >
                <input
                  type="number"
                  bind:value={designConfig.textBox.size.height}
                  on:input={() =>
                    updateConfig({
                      textBox: {
                        ...designConfig.textBox,
                        size: {
                          ...designConfig.textBox.size,
                          height: designConfig.textBox.size.height,
                        },
                      },
                    })}
                  min="100"
                  max="400"
                  class="bg-transparent border-none text-white p-3 text-sm flex-1 outline-none"
                />
                <span
                  class="px-3 py-3 bg-gray-600 text-gray-300 text-xs font-medium"
                  >px</span
                >
              </div>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={designConfig.textBox.background.enabled}
                on:change={() =>
                  updateConfig({
                    textBox: {
                      ...designConfig.textBox,
                      background: {
                        ...designConfig.textBox.background,
                        enabled: designConfig.textBox.background.enabled,
                      },
                    },
                  })}
                class="w-4 h-4 accent-cyan-400"
              />
              <span class="text-gray-300 text-sm">Enable Background</span>
            </label>
          </div>
        </div>
      </div>
      <!-- Preview Section -->
      <div class="flex-1 max-w-none lg:max-w-lg xl:max-w-xl mt-4 lg:mt-0">
        <div
          class="flex items-center justify-between mb-4 lg:mb-6 pb-4 border-b border-gray-700"
        >
          <h4 class="text-cyan-400 text-base lg:text-lg font-semibold">
            Live Preview
          </h4>
          <div
            class="bg-gradient-to-r from-gray-600 to-gray-700 text-cyan-400 px-3 py-2 rounded-lg text-xs font-semibold font-mono border border-gray-500 shadow-md"
          >
            {designConfig.canvas.width} × {designConfig.canvas.height}
          </div>
        </div>
        {#if generatingPreview}
          <div
            class="flex flex-col justify-center items-center min-h-[300px] lg:min-h-[400px] bg-gray-800/80 rounded-xl text-gray-400 gap-4"
          >
            <div
              class="w-8 h-8 border-3 border-gray-600 border-t-cyan-400 rounded-full animate-spin"
            ></div>
            <span class="text-sm">Generating preview...</span>
          </div>
        {:else if previewUrl}
          <div
            class="flex justify-center items-center min-h-[300px] lg:min-h-[400px] bg-gray-800/90 rounded-xl p-6 lg:p-8 border-2 border-gray-600 relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-400/5 to-transparent pointer-events-none"
            ></div>
            <img
              src={previewUrl}
              alt="Ticket Preview"
              class="max-w-full max-h-[300px] lg:max-h-[500px] rounded-xl shadow-2xl relative z-10 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl"
            />
          </div>
        {:else}
          <div
            class="flex flex-col justify-center items-center min-h-[300px] lg:min-h-[400px] bg-gray-800/80 rounded-xl text-gray-400 gap-4"
          >
            <div class="text-5xl opacity-50">🎫</div>
            <span class="text-sm italic">No preview available</span>
          </div>
        {/if}
      </div>
    </div>
    <!-- End of collapsible configuration sections -->
  </div>
</div>

<style>
  /* Custom slider styles for better appearance */
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
  }
</style>

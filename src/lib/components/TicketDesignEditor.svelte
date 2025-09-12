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
        guestName: "John Doe",
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
</script>

<div class="ticket-design-editor">
  <div class="editor-header">
    <h3>Ticket Design Editor</h3>
    <button on:click={resetToDefault} class="reset-btn">Reset to Default</button
    >
  </div>

  <div class="editor-content">
    <!-- Canvas Settings -->
    <div class="config-section">
      <h4>Canvas Size</h4>
      <div class="input-group">
        <label>
          Width:
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
          />
        </label>
        <label>
          Height:
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
          />
        </label>
      </div>
    </div>

    <!-- QR Code Settings -->
    <div class="config-section">
      <h4>QR Code</h4>
      <div class="input-group">
        <label>
          Size:
          <input
            type="range"
            min="60"
            max="150"
            bind:value={designConfig.qrCode.size}
            on:input={() => updateQrCodeSize(designConfig.qrCode.size)}
          />
          {designConfig.qrCode.size}px
        </label>
      </div>
      <div class="input-group">
        <label>
          Position X:
          <select
            bind:value={designConfig.qrCode.position.x}
            on:change={() =>
              updateQrCodePosition(
                designConfig.qrCode.position.x,
                designConfig.qrCode.position.y
              )}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label>
          Position Y:
          <select
            bind:value={designConfig.qrCode.position.y}
            on:change={() =>
              updateQrCodePosition(
                designConfig.qrCode.position.x,
                designConfig.qrCode.position.y
              )}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>
    </div>

    <!-- Text Colors -->
    <div class="config-section">
      <h4>Text Colors</h4>
      <div class="color-grid">
        <label>
          Primary Name:
          <input
            type="color"
            bind:value={designConfig.colors.primaryName}
            on:input={() =>
              updateColor("primaryName", designConfig.colors.primaryName)}
          />
        </label>
        <label>
          Event Name:
          <input
            type="color"
            bind:value={designConfig.colors.eventName}
            on:input={() =>
              updateColor("eventName", designConfig.colors.eventName)}
          />
        </label>
        <label>
          Date/Time:
          <input
            type="color"
            bind:value={designConfig.colors.dateTime}
            on:input={() =>
              updateColor("dateTime", designConfig.colors.dateTime)}
          />
        </label>
        <label>
          Location:
          <input
            type="color"
            bind:value={designConfig.colors.location}
            on:input={() =>
              updateColor("location", designConfig.colors.location)}
          />
        </label>
        <label>
          Ticket Type:
          <input
            type="color"
            bind:value={designConfig.colors.ticketType}
            on:input={() =>
              updateColor("ticketType", designConfig.colors.ticketType)}
          />
        </label>
        <label>
          Ticket Number:
          <input
            type="color"
            bind:value={designConfig.colors.ticketNumber}
            on:input={() =>
              updateColor("ticketNumber", designConfig.colors.ticketNumber)}
          />
        </label>
      </div>
    </div>

    <!-- Font Sizes -->
    <div class="config-section">
      <h4>Font Sizes</h4>
      <div class="font-grid">
        <label>
          Primary Name:
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
          />
          {designConfig.fonts.primaryName.size}px
        </label>
        <label>
          Event Name:
          <input
            type="range"
            min="12"
            max="30"
            bind:value={designConfig.fonts.eventName.size}
            on:input={() =>
              updateFontSize("eventName", designConfig.fonts.eventName.size)}
          />
          {designConfig.fonts.eventName.size}px
        </label>
        <label>
          Date/Time:
          <input
            type="range"
            min="10"
            max="24"
            bind:value={designConfig.fonts.dateTime.size}
            on:input={() =>
              updateFontSize("dateTime", designConfig.fonts.dateTime.size)}
          />
          {designConfig.fonts.dateTime.size}px
        </label>
        <label>
          Location:
          <input
            type="range"
            min="10"
            max="20"
            bind:value={designConfig.fonts.location.size}
            on:input={() =>
              updateFontSize("location", designConfig.fonts.location.size)}
          />
          {designConfig.fonts.location.size}px
        </label>
        <label>
          Ticket Type:
          <input
            type="range"
            min="12"
            max="28"
            bind:value={designConfig.fonts.ticketType.size}
            on:input={() =>
              updateFontSize("ticketType", designConfig.fonts.ticketType.size)}
          />
          {designConfig.fonts.ticketType.size}px
        </label>
      </div>
    </div>

    <!-- Text Box Settings -->
    <div class="config-section">
      <h4>Text Box</h4>
      <div class="input-group">
        <label>
          Position X:
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
          />
        </label>
        <label>
          Position Y:
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
          />
        </label>
      </div>
      <div class="input-group">
        <label>
          Height:
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
          />
        </label>
        <label>
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
          />
          Enable Background
        </label>
      </div>
    </div>
  </div>

  <!-- Preview Section -->
  <div class="preview-section">
    <h4>Live Preview</h4>
    {#if generatingPreview}
      <div class="preview-loading">Generating preview...</div>
    {:else if previewUrl}
      <div class="preview-container">
        <img src={previewUrl} alt="Ticket Preview" class="preview-image" />
      </div>
    {:else}
      <div class="preview-placeholder">No preview available</div>
    {/if}
  </div>
</div>

<style>
  .ticket-design-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.75rem;
    background: #1a1a1a;
    border-radius: 8px;
    color: white;
  }

  .editor-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .editor-header h3 {
    margin: 0;
    color: #00f5ff;
    font-size: 1rem;
  }

  .reset-btn {
    background: #ff4444;
    color: white;
    border: none;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    width: 100%;
  }

  .reset-btn:hover {
    background: #ff6666;
  }

  .editor-content {
    flex: 1;
    max-width: none;
  }

  .config-section {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: #2a2a2a;
    border-radius: 6px;
  }

  .config-section h4 {
    margin: 0 0 0.75rem 0;
    color: #00f5ff;
    font-size: 0.95rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 0.75rem;
  }

  .input-group label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
  }

  .input-group input,
  .input-group select {
    background: #3a3a3a;
    border: 1px solid #555;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .input-group input[type="color"] {
    width: 100%;
    height: 35px;
    padding: 0;
    border: none;
    border-radius: 4px;
  }

  .input-group input[type="range"] {
    width: 100%;
  }

  .color-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .font-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-section {
    flex: 1;
    max-width: none;
    margin-top: 1rem;
  }

  .preview-section h4 {
    margin: 0 0 0.75rem 0;
    color: #00f5ff;
    font-size: 0.95rem;
  }

  .preview-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    background: #2a2a2a;
    border-radius: 6px;
    padding: 0.75rem;
  }

  .preview-image {
    max-width: 100%;
    max-height: 300px;
    border-radius: 4px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .preview-loading,
  .preview-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    background: #2a2a2a;
    border-radius: 6px;
    color: #888;
    font-style: italic;
    font-size: 0.8rem;
  }

  /* Tablet and larger screens */
  @media (min-width: 640px) {
    .ticket-design-editor {
      flex-direction: row;
      gap: 1.5rem;
      padding: 1rem;
    }

    .editor-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .editor-header h3 {
      font-size: 1.1rem;
    }

    .reset-btn {
      width: auto;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .editor-content {
      max-width: 400px;
    }

    .config-section {
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .config-section h4 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .input-group {
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .input-group label {
      flex-direction: row;
      align-items: center;
      font-size: 0.9rem;
    }

    .input-group input,
    .input-group select {
      font-size: 0.9rem;
    }

    .input-group input[type="color"] {
      width: 40px;
      height: 30px;
    }

    .input-group input[type="range"] {
      flex: 1;
    }

    .color-grid {
      grid-template-columns: 1fr 1fr;
    }

    .preview-section {
      max-width: 400px;
      margin-top: 0;
    }

    .preview-section h4 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .preview-container {
      min-height: 300px;
      padding: 1rem;
    }

    .preview-image {
      max-height: 500px;
    }

    .preview-loading,
    .preview-placeholder {
      min-height: 300px;
      font-size: 0.9rem;
    }
  }

  /* Desktop and larger screens */
  @media (min-width: 1024px) {
    .ticket-design-editor {
      gap: 2rem;
    }

    .editor-header h3 {
      font-size: 1.2rem;
    }

    .reset-btn {
      font-size: 1rem;
    }

    .config-section h4 {
      font-size: 1.2rem;
    }

    .input-group label {
      font-size: 1rem;
    }

    .input-group input,
    .input-group select {
      font-size: 1rem;
    }

    .preview-section h4 {
      font-size: 1.2rem;
    }

    .preview-loading,
    .preview-placeholder {
      font-size: 1rem;
    }
  }
</style>

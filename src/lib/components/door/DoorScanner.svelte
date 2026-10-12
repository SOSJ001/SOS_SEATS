<script>
  // @ts-nocheck
  /**
   * Shared door scanner (roadmap 7.2): organisers now, assigned staff in 7.3.
   * Two steps: a decode validates (no check-in), then the door taps Check In.
   * Desktop kiosk 55:2244 / 55:2275 / 55:2303; mobile 4:851 / 440:127 / 440:100.
   * The scanned token stays in memory for the Check In tap only; never log or display it.
   */
  import { onMount } from "svelte";
  import { invalidate } from "$app/navigation";
  import Check from "lucide-svelte/icons/check";
  import QrCode from "lucide-svelte/icons/qr-code";
  import CameraOff from "lucide-svelte/icons/camera-off";
  import ShieldAlert from "lucide-svelte/icons/shield-alert";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import ScannerCamera from "./ScannerCamera.svelte";
  import ScanResultPanel from "./ScanResultPanel.svelte";
  import ScannerStats from "./ScannerStats.svelte";
  import RecentScansList from "./RecentScansList.svelte";
  import { networkErrorResult, toScanResult } from "./scanResult.js";
  import { percent } from "./doorFormat.js";

  /** { id, name, date, time, location } */
  export let event;
  /** { checkedIn, total, rate, lastScanAt } */
  export let stats = { checkedIn: 0, total: 0, rate: 0, lastScanAt: null };
  export let recent = [];
  /** "organiser" | "staff" */
  export let role = "organiser";
  export let backHref = "/dashboard/scanner";
  export let userName = "";

  let camera;
  let cameraState = "idle";
  let cameraError = "";
  let result = null;
  let busy = false;
  let pendingToken = null;

  $: checkedIn = stats?.checkedIn ?? 0;
  $: total = stats?.total ?? 0;
  $: rate = percent(checkedIn, total);
  $: cameraLive = cameraState === "active" || cameraState === "paused";
  $: cameraUnavailable = cameraState === "blocked" || cameraState === "insecure";
  $: footerRole = role === "staff" ? "Staff" : "Organiser";
  $: footerScope = role === "staff" ? "Assigned events only" : "Your events";

  async function post(path, token) {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, token }),
      });
      const body = await res.json().catch(() => null);
      return toScanResult(res.status, body);
    } catch {
      return networkErrorResult();
    }
  }

  async function handleDecode(e) {
    if (busy || result) return;
    const token = e.detail;
    busy = true;
    const next = await post("/api/scanner/validate", token);
    pendingToken = next.kind === "valid" ? token : null;
    result = next;
    busy = false;
  }

  async function checkIn() {
    if (busy || !pendingToken) return;
    busy = true;
    const token = pendingToken;
    pendingToken = null;
    result = await post("/api/scanner/check-in", token);
    busy = false;
    if (result.kind === "checked_in") invalidate("door:scan");
  }

  function clearResult() {
    result = null;
    pendingToken = null;
  }

  function scanNext() {
    clearResult();
    camera?.start();
  }

  function stopScanning() {
    clearResult();
    camera?.stop();
  }

  // Desktop is a kiosk: start straight away. Mobile waits for the Scan tap.
  onMount(() => {
    if (window.matchMedia("(min-width: 768px)").matches) camera?.start();
  });
</script>

<!-- Desktop height: 72px must match the DoorShell scanner header height -->
<div class="flex flex-1 flex-col md:grid md:h-[calc(100vh-72px)] md:flex-none md:grid-cols-2 md:grid-rows-1">
  <!-- Mobile event header (4:851) -->
  <div class="flex flex-col gap-1 px-5 pt-5 pb-4 md:hidden">
    <p class="m-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.8px] text-brand">
      <span
        class="size-2 rounded-full {cameraState === 'active' ? 'bg-brand animate-pulse' : 'bg-ink-muted'}"
        aria-hidden="true"
      ></span>
      {cameraState === "active" ? "Live" : "Door scanner"}
    </p>
    <h1 class="m-0 text-[28px] font-extrabold leading-tight text-ink">{event.name}</h1>
    <p class="m-0 text-sm text-ink-secondary">Point camera at guest ticket QR code</p>
  </div>

  <!-- Viewfinder: one camera for both layouts; on mobile it hides behind a result -->
  <section class="px-5 md:px-0 {result ? 'hidden md:block' : ''}">
    <div
      class="relative h-[380px] overflow-hidden rounded-2xl border-2 border-brand bg-paper-cream md:h-full md:rounded-none md:rounded-tr-2xl md:border-l-0 md:border-b-0"
    >
      <ScannerCamera
        bind:this={camera}
        bind:state={cameraState}
        bind:errorMessage={cameraError}
        on:decode={handleDecode}
      />

      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <span class="absolute left-3.5 top-3.5 size-[30px] rounded-tl-lg border-l-4 border-t-4 border-brand md:size-9"></span>
        <span class="absolute right-3.5 top-3.5 size-[30px] rounded-tr-lg border-r-4 border-t-4 border-brand md:size-9"></span>
        <span class="absolute bottom-3.5 left-3.5 size-[30px] rounded-bl-lg border-b-4 border-l-4 border-brand md:size-9"></span>
        <span class="absolute bottom-3.5 right-3.5 size-[30px] rounded-br-lg border-b-4 border-r-4 border-brand md:size-9"></span>
        {#if cameraState === "active"}
          <span
            class="door-scan-line absolute left-1/2 top-1/2 h-1 w-[280px] -translate-x-1/2 rounded-full bg-brand shadow-[0_0_16px_rgba(255,90,31,0.8)] md:w-[360px]"
          ></span>
        {/if}
      </div>

      {#if !cameraLive}
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          {#if cameraState === "starting"}
            <LoaderCircle class="size-12 animate-spin text-brand" aria-hidden="true" />
            <p class="m-0 text-lg font-extrabold text-ink">Starting camera</p>
            <p class="m-0 text-sm text-ink-secondary">Allow camera access if your browser asks.</p>
          {:else if cameraUnavailable}
            <svelte:component
              this={cameraState === "insecure" ? ShieldAlert : CameraOff}
              class="size-12 text-[#ef4444]"
              aria-hidden="true"
            />
            <p class="m-0 text-lg font-extrabold text-ink">
              {cameraState === "insecure" ? "Camera unavailable" : "Camera blocked"}
            </p>
            <p class="m-0 max-w-xs text-sm text-ink-secondary">{cameraError}</p>
            {#if cameraState === "blocked"}
              <button
                type="button"
                class="hidden md:inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-[13px] font-bold text-white hover:bg-[#e94d14] border-0 cursor-pointer"
                on:click={() => camera?.start()}
              >
                Try again
              </button>
            {/if}
          {:else}
            <QrCode class="size-16 text-ink-muted md:size-12" aria-hidden="true" />
            <p class="m-0 text-lg font-extrabold text-ink">Point camera at QR code</p>
            <p class="m-0 text-sm text-ink-secondary">
              <span class="md:hidden">Autofocus enabled · Stay in bright light</span>
              <span class="hidden md:inline">Start the camera to check in guests</span>
            </p>
            <button
              type="button"
              class="hidden md:inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-bold text-white hover:bg-[#e94d14] border-0 cursor-pointer"
              on:click={() => camera?.start()}
            >
              <QrCode class="size-4" aria-hidden="true" />
              Start camera
            </button>
          {/if}
        </div>
      {:else if cameraState === "active" && !busy}
        <p
          class="pointer-events-none absolute inset-x-0 bottom-8 m-0 text-center text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]"
        >
          Scanner is active and ready to check in guests
        </p>
      {/if}

      {#if busy}
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper-cream/90" role="status">
          <LoaderCircle class="size-12 animate-spin text-brand" aria-hidden="true" />
          <p class="m-0 text-lg font-extrabold text-ink">Checking ticket</p>
        </div>
      {:else if result}
        <div class="absolute inset-0 hidden items-center justify-center bg-paper-cream md:flex">
          <ScanResultPanel {result} part="hero" />
        </div>
      {/if}
    </div>
  </section>

  <!-- Mobile result (440:127 / 440:100) -->
  {#if result}
    <section class="px-5 md:hidden">
      <ScanResultPanel {result} part="mobile" />
    </section>
  {/if}

  <!-- Desktop kiosk panel -->
  <section class="hidden flex-col gap-4 bg-paper p-5 md:flex md:overflow-y-auto">
    {#if result}
      <ScannerStats {stats} layout="compact" />
      <ScanResultPanel {result} part="details" />
      {#if result.kind === "valid"}
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#16a34a] text-[13px] font-bold text-white hover:bg-[#15803d] disabled:opacity-60 border-0 cursor-pointer"
            disabled={busy}
            on:click={checkIn}
          >
            <Check class="size-4" strokeWidth={3} aria-hidden="true" />
            Check In
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-lg border border-paper-border bg-paper text-[13px] font-bold text-ink-secondary hover:border-brand hover:text-brand disabled:opacity-60 cursor-pointer"
            disabled={busy}
            on:click={scanNext}
          >
            Scan Next Ticket
          </button>
        </div>
      {:else}
        <button
          type="button"
          class="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-white hover:bg-[#e94d14] border-0 cursor-pointer"
          on:click={scanNext}
        >
          Scan Next Ticket
        </button>
      {/if}
    {:else}
      <ScannerStats {stats} layout="bar" />
      <RecentScansList scans={recent} />
    {/if}
  </section>

  <!-- Mobile controls (4:851) -->
  <section class="flex flex-col gap-4 px-5 pt-5 pb-8 md:hidden">
    {#if !result}
      <button
        type="button"
        class="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-white hover:bg-[#e94d14] disabled:opacity-70 border-0 cursor-pointer"
        disabled={cameraState === "starting" || cameraState === "active" || cameraState === "insecure" || busy}
        on:click={() => camera?.start()}
      >
        <QrCode class="size-5" aria-hidden="true" />
        {cameraState === "active" || busy ? "Scanning..." : "Scan"}
      </button>
      <a
        href={backHref}
        class="inline-flex h-11 items-center justify-center rounded-xl border-[1.5px] border-brand bg-paper text-sm font-bold text-brand no-underline hover:bg-brand-ghost"
      >
        Back
      </a>
    {:else if result.kind === "valid"}
      <button
        type="button"
        class="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#16a34a] text-base font-bold text-white hover:bg-[#15803d] disabled:opacity-60 border-0 cursor-pointer"
        disabled={busy}
        on:click={checkIn}
      >
        {#if busy}
          <LoaderCircle class="size-5 animate-spin" aria-hidden="true" />
        {:else}
          <Check class="size-5" strokeWidth={3} aria-hidden="true" />
        {/if}
        Check In
      </button>
      <button
        type="button"
        class="inline-flex h-11 items-center justify-center rounded-lg border-[1.5px] border-brand bg-paper text-sm font-bold text-brand hover:bg-brand-ghost disabled:opacity-60 cursor-pointer"
        disabled={busy}
        on:click={scanNext}
      >
        Scan Next
      </button>
    {:else}
      <button
        type="button"
        class="inline-flex h-12 items-center justify-center rounded-lg bg-brand text-base font-bold text-white hover:bg-[#e94d14] border-0 cursor-pointer"
        on:click={scanNext}
      >
        {result.kind === "checked_in" ? "Scan Next" : "Scan Again"}
      </button>
      <button
        type="button"
        class="inline-flex h-11 items-center justify-center rounded-lg border-[1.5px] border-brand bg-paper text-sm font-bold text-brand hover:bg-brand-ghost cursor-pointer"
        on:click={stopScanning}
      >
        Stop
      </button>
    {/if}

    <div class="flex flex-col gap-2 rounded-xl bg-[#f8fafc] p-4">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm font-medium text-ink-secondary">Checked in count:</span>
        <span class="text-base font-extrabold text-ink">{checkedIn} / {total} Guests</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-paper-border">
        <div class="h-full rounded-full bg-brand" style="width: {rate}%"></div>
      </div>
    </div>

    <p class="m-0 rounded-lg bg-[#f8f5f2] px-4 py-3 text-[13px] text-ink-secondary">
      {footerRole}: <strong class="font-bold text-ink">{userName || "-"}</strong> - {footerScope}
    </p>
  </section>
</div>

<style>
  .door-scan-line {
    animation: door-scan 2.4s ease-in-out infinite;
  }
  @keyframes door-scan {
    0%,
    100% {
      transform: translate(-50%, -110px);
    }
    50% {
      transform: translate(-50%, 110px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .door-scan-line {
      animation: none;
    }
  }
</style>

<script>
  // @ts-nocheck
  /**
   * Door camera (roadmap 7.2): html5-qrcode, back camera, fills its parent.
   * Pauses itself on each decode so one QR is handled once; the parent calls resume() for the
   * next ticket. Keep it mounted between scans (hide it with CSS) so the camera isn't restarted.
   * Never log the decoded text: it is the secret ticket token.
   */
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { doorScannerStatus } from "$lib/client/doorUi.js";

  /** "idle" | "starting" | "active" | "paused" | "blocked" | "insecure" */
  export let state = "idle";
  export let errorMessage = "";

  const dispatch = createEventDispatcher();
  const elementId = `door-camera-${Math.random().toString(36).slice(2, 10)}`;

  let lib = null;
  let scanner = null;
  let destroyed = false;

  function setState(next) {
    state = next;
    if (!destroyed) doorScannerStatus.set(next);
    dispatch("status", next);
  }

  function describeError(err) {
    const name = err?.name || "";
    const text = String(err?.message || err || "");
    if (name === "NotAllowedError" || /permission|denied|notallowed/i.test(text)) {
      return "Camera access was blocked. Allow camera access in your browser settings, then try again.";
    }
    if (name === "NotFoundError" || /notfound|no camera|requested device not found/i.test(text)) {
      return "No camera was found on this device.";
    }
    if (name === "NotReadableError" || /notreadable|in use/i.test(text)) {
      return "The camera is in use by another app. Close it and try again.";
    }
    return "Couldn't start the camera. Please try again.";
  }

  function onDecode(text) {
    if (state !== "active") return;
    try {
      scanner?.pause(true);
    } catch {
      // already paused
    }
    setState("paused");
    dispatch("decode", text);
  }

  export async function start() {
    if (destroyed || state === "insecure" || state === "starting" || state === "active") return;
    if (state === "paused") {
      resume();
      return;
    }
    errorMessage = "";
    setState("starting");
    try {
      if (!lib) lib = await import("html5-qrcode");
      if (destroyed) return;
      if (!scanner) {
        scanner = new lib.Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [lib.Html5QrcodeSupportedFormats.QR_CODE],
        });
      }
      await scanner.start({ facingMode: "environment" }, { fps: 10 }, onDecode, () => {});
      if (destroyed) {
        await stop();
        return;
      }
      setState("active");
    } catch (err) {
      errorMessage = describeError(err);
      setState("blocked");
    }
  }

  export function resume() {
    if (state !== "paused" || !scanner) return;
    try {
      scanner.resume();
      setState("active");
    } catch {
      // The stream was lost while paused; start again
      state = "idle";
      start();
    }
  }

  export async function stop() {
    if (!scanner) {
      if (state !== "insecure") setState("idle");
      return;
    }
    try {
      if (state === "active" || state === "paused") await scanner.stop();
      scanner.clear();
    } catch {
      // already stopped
    }
    scanner = null;
    if (!destroyed && state !== "insecure") setState("idle");
  }

  onMount(() => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      errorMessage = "The camera needs a secure (https) connection.";
      setState("insecure");
      return;
    }
    doorScannerStatus.set("idle");
  });

  onDestroy(() => {
    destroyed = true;
    if (scanner) {
      const s = scanner;
      scanner = null;
      Promise.resolve()
        .then(() => s.stop())
        .catch(() => {})
        .finally(() => {
          try {
            s.clear();
          } catch {
            // ignore
          }
        });
    }
    if (typeof window !== "undefined") doorScannerStatus.set("idle");
  });
</script>

<!-- !absolute: html5-qrcode sets an inline position: relative on this element when it starts -->
<div id={elementId} class="door-camera !absolute inset-0 overflow-hidden"></div>

<style>
  .door-camera :global(video) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }
</style>

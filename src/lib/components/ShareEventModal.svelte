<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  import { toDataURL } from "qrcode";
  import X from "lucide-svelte/icons/x";
  import Copy from "lucide-svelte/icons/copy";
  import Check from "lucide-svelte/icons/check";
  import Download from "lucide-svelte/icons/download";
  import Calendar from "lucide-svelte/icons/calendar";
  import MapPin from "lucide-svelte/icons/map-pin";
  import Facebook from "lucide-svelte/icons/facebook";
  import Twitter from "lucide-svelte/icons/twitter";
  import MessageCircle from "lucide-svelte/icons/message-circle";
  import Send from "lucide-svelte/icons/send";
  import Linkedin from "lucide-svelte/icons/linkedin";
  import Mail from "lucide-svelte/icons/mail";
  import MessageSquare from "lucide-svelte/icons/message-square";

  const dispatch = createEventDispatcher();

  export let event = {};
  export let isOpen = false;

  let copied = false;
  let eventLink = "";
  let qrCodeUrl = "";

  const SOCIALS = [
    { id: "facebook", label: "Facebook", icon: Facebook },
    { id: "twitter", label: "Twitter", icon: Twitter },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "telegram", label: "Telegram", icon: Send },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS", icon: MessageSquare },
  ];

  // Reactive statement to update eventLink when event changes
  $: {
    if (typeof window !== "undefined" && event && event.id) {
      const baseUrl = window.location.origin;
      // Use the same link structure as the new implementation
      eventLink = `${baseUrl}/marketplace/eventDetails/${event.id}`;
      renderQrCode(eventLink);
    }
  }

  /** @param {string} link */
  async function renderQrCode(link) {
    try {
      const dataUrl = await toDataURL(link, { width: 300, margin: 1 });
      if (link === eventLink) qrCodeUrl = dataUrl;
    } catch {
      if (link === eventLink) qrCodeUrl = "";
    }
  }

  function closeModal() {
    dispatch("close");
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (isOpen && e.key === "Escape") closeModal();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventLink);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      }
  }

  function shareOnSocial(platform) {
    if (!event || !event.title) return;

    const text = `Check out this amazing event: ${event.title}`;
    const url = encodeURIComponent(eventLink);

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(text)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} - ${eventLink}`)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${url}&text=${encodeURIComponent(text)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "email":
        const subject = encodeURIComponent(
          `Check out this event: ${event.title}`
        );
        const body = encodeURIComponent(`${text}\n\n${eventLink}`);
        shareUrl = `mailto:?subject=${subject}&body=${body}`;
        break;
      case "sms":
        const message = encodeURIComponent(`${text} - ${eventLink}`);
        shareUrl = `sms:?body=${message}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  }

  function downloadQRCode() {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `qr-code-${event.title?.replace(/\s+/g, "-").toLowerCase() || "event"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if isOpen && event}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-paper-border bg-paper shadow-public-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-event-title"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-paper-border p-5 sm:p-6">
        <h2 id="share-event-title" class="m-0 text-[20px] font-bold text-ink">Share Your Event</h2>
        <button
          type="button"
          on:click={closeModal}
          class="cursor-pointer rounded-lg p-1 text-ink-secondary transition-colors hover:bg-paper-cream hover:text-ink"
          aria-label="Close"
        >
          <X class="size-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Event Info -->
      <div class="border-b border-paper-border p-5 sm:p-6">
        <div class="rounded-xl bg-[#fff7f2] p-4">
          <h3 class="m-0 mb-2 text-[16px] font-bold text-ink">
            {event.title || "Event"}
          </h3>
          <p class="m-0 mb-1 flex items-center gap-1.5 text-[13px] text-ink-secondary">
            <Calendar class="size-3.5 shrink-0" aria-hidden="true" />
            {event.date || "Date not set"}
          </p>
          <p class="m-0 flex items-center gap-1.5 text-[13px] text-ink-secondary">
            <MapPin class="size-3.5 shrink-0" aria-hidden="true" />
            {event.location || "Location not set"}
          </p>
        </div>
      </div>

      <!-- Share Link Section -->
      <div class="border-b border-paper-border p-5 sm:p-6">
        <h4 class="m-0 mb-3 text-[14px] font-bold text-ink">Event Link</h4>
        <div class="flex gap-2">
          <input
            type="text"
            value={eventLink}
            readonly
            class="min-w-0 flex-1 rounded-lg border border-paper-border bg-paper-cream px-3 py-2 text-[13px] text-ink focus:border-brand focus:outline-none focus:ring-0"
          />
          <button
            type="button"
            on:click={copyLink}
            class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            {#if copied}
              <Check class="size-4" aria-hidden="true" />
              Copied!
            {:else}
              <Copy class="size-4" aria-hidden="true" />
              Copy
            {/if}
          </button>
        </div>
      </div>

      <!-- Social Media Buttons -->
      <div class="border-b border-paper-border p-5 sm:p-6">
        <h4 class="m-0 mb-4 text-[14px] font-bold text-ink">Share on Social Media</h4>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
          {#each SOCIALS as social (social.id)}
            <button
              type="button"
              on:click={() => shareOnSocial(social.id)}
              class="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-paper-border bg-paper px-4 py-3 text-left text-[13px] font-semibold text-ink transition-colors hover:border-brand/40 hover:bg-[#fff7f2]"
            >
              <svelte:component this={social.icon} class="size-5 text-brand" aria-hidden="true" />
              {social.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="p-5 sm:p-6">
        <h4 class="m-0 mb-4 text-[14px] font-bold text-ink">QR Code</h4>
        <div class="flex flex-col items-center gap-4">
          <div class="rounded-xl border border-paper-border bg-paper p-4">
            {#if qrCodeUrl}
              <img src={qrCodeUrl} alt="QR Code for event" class="h-48 w-48" />
            {:else}
              <div class="h-48 w-48" aria-hidden="true"></div>
            {/if}
          </div>
          <p class="m-0 text-center text-[13px] text-ink-secondary">
            Scan this QR code to access the event page
          </p>
          <button
            type="button"
            on:click={downloadQRCode}
            class="flex cursor-pointer items-center gap-2 rounded-[10px] bg-brand px-6 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
          >
            <Download class="size-4" aria-hidden="true" />
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

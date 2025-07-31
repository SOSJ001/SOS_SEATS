<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let event = {};
  export let isOpen = false;

  let copied = false;
  let eventLink = "";
  let qrCodeUrl = "";

  // Reactive statement to update eventLink when event changes
  $: {
    if (typeof window !== "undefined" && event && event.id) {
      const baseUrl = window.location.origin;
      // Use the same link structure as the new implementation
      eventLink = `${baseUrl}/marketplace/eventDetails/${event.id}`;
      // Generate QR code URL using a free QR code service
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventLink)}`;
    }
  }

  function closeModal() {
    dispatch("close");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventLink);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
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

{#if isOpen && event}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-700"
      >
        <h2 class="text-2xl font-bold text-white">Share Your Event</h2>
        <button
          on:click={closeModal}
          class="text-gray-400 hover:text-white transition-colors duration-200"
        >
          <svg
            class="w-6 h-6"
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

      <!-- Event Info -->
      <div class="p-6 border-b border-gray-700">
        <div class="bg-gray-700/50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-white mb-2">
            {event.title || "Event"}
          </h3>
          <p class="text-gray-300 text-sm mb-1">
            {event.date || "Date not set"}
          </p>
          <p class="text-gray-300 text-sm">
            {event.location || "Location not set"}
          </p>
        </div>
      </div>

      <!-- Share Link Section -->
      <div class="p-6 border-b border-gray-700">
        <h4 class="text-white font-medium mb-3">Event Link</h4>
        <div class="flex gap-2">
          <input
            type="text"
            value={eventLink}
            readonly
            class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            on:click={copyLink}
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <!-- Social Media Buttons -->
      <div class="p-6 border-b border-gray-700">
        <h4 class="text-white font-medium mb-4">Share on Social Media</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <!-- Facebook -->
          <button
            on:click={() => shareOnSocial("facebook")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            <span class="text-sm">Facebook</span>
          </button>

          <!-- Twitter -->
          <button
            on:click={() => shareOnSocial("twitter")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
              />
            </svg>
            <span class="text-sm">Twitter</span>
          </button>

          <!-- WhatsApp -->
          <button
            on:click={() => shareOnSocial("whatsapp")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
              />
            </svg>
            <span class="text-sm">WhatsApp</span>
          </button>

          <!-- Telegram -->
          <button
            on:click={() => shareOnSocial("telegram")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
              />
            </svg>
            <span class="text-sm">Telegram</span>
          </button>

          <!-- LinkedIn -->
          <button
            on:click={() => shareOnSocial("linkedin")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
              />
            </svg>
            <span class="text-sm">LinkedIn</span>
          </button>

          <!-- Email -->
          <button
            on:click={() => shareOnSocial("email")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              />
            </svg>
            <span class="text-sm">Email</span>
          </button>

          <!-- SMS -->
          <button
            on:click={() => shareOnSocial("sms")}
            class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <svg
              class="w-5 h-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
              />
            </svg>
            <span class="text-sm">SMS</span>
          </button>
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="p-6">
        <h4 class="text-white font-medium mb-4">QR Code</h4>
        <div class="flex flex-col items-center space-y-4">
          <div class="bg-white p-4 rounded-lg">
            <img
              src={qrCodeUrl}
              alt="QR Code for event"
              class="w-48 h-48"
              loading="lazy"
            />
          </div>
          <p class="text-gray-300 text-sm text-center">
            Scan this QR code to access the event page
          </p>
          <button
            on:click={downloadQRCode}
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

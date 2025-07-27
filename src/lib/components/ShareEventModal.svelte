<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let event = {};
  export let isOpen = false;

  let copied = false;
  let eventLink = "";

  // Reactive statement to update eventLink when event changes
  $: {
    const baseUrl = window.location.origin;
    if (event && event.title) {
      eventLink = `${baseUrl}/events/${event.id}`;
    } else {
      eventLink = `${baseUrl}/events`;
    }
  }

  function closeModal() {
    dispatch("close");
  }

  function copyLink() {
    navigator.clipboard.writeText(eventLink).then(() => {
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    });
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
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`${text}\n\n${eventLink}`)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  }

  function downloadQRCode() {
    console.log("Downloading QR code...");
  }
</script>

{#if isOpen && event}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div
      class="bg-gray-900 rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
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
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-white mb-2">
          {event.title || "Event"}
        </h3>
        <p class="text-gray-300 text-sm">{event.date || "Date not set"}</p>
        <p class="text-gray-300 text-sm">
          {event.location || "Location not set"}
        </p>
      </div>

      <!-- Share Link Section -->
      <div class="mb-6">
        <label
          for="event-link"
          class="block text-sm font-medium text-gray-300 mb-2">Event Link</label
        >
        <div class="flex gap-2">
          <input
            id="event-link"
            type="text"
            value={eventLink}
            readonly
            class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            on:click={copyLink}
            class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <!-- Social Media Buttons -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-300 mb-3">
          Share on Social Media
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <button
            on:click={() => shareOnSocial("facebook")}
            class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            Facebook
          </button>
          <button
            on:click={() => shareOnSocial("twitter")}
            class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
              />
            </svg>
            Twitter
          </button>
          <button
            on:click={() => shareOnSocial("linkedin")}
            class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
              />
            </svg>
            LinkedIn
          </button>
          <button
            on:click={() => shareOnSocial("email")}
            class="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email
          </button>
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-300 mb-3">QR Code</h4>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div
            class="w-32 h-32 bg-white mx-auto mb-3 flex items-center justify-center"
          >
            <span class="text-gray-500 text-xs">QR Code</span>
          </div>
          <button
            on:click={downloadQRCode}
            class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm"
          >
            Download QR Code
          </button>
        </div>
      </div>

      <!-- Close Button -->
      <div class="flex justify-end">
        <button
          on:click={closeModal}
          class="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

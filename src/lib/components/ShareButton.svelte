<script lang="ts">
  export let url: string = "";
  export let title: string = "";
  export let description: string = "";
  export let top: string = "top-20";
  export let right: string = "right-6";

  let showShareMenu = false;
  let showShareModal = false;
  let showQRModal = false;
  let qrCodeUrl = "";

  function toggleShareMenu() {
    showShareMenu = !showShareMenu;
  }

  function openShareModal() {
    showShareMenu = false;
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
  }

  function openQRModal() {
    showShareModal = false;
    // Generate QR code URL using a free QR code service
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    showQRModal = true;
  }

  function closeQRModal() {
    showQRModal = false;
  }

  function shareOnFacebook() {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
    showShareMenu = false;
  }

  function shareOnTwitter() {
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
    showShareMenu = false;
  }

  function shareOnWhatsApp() {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`;
    window.open(shareUrl, "_blank");
    showShareMenu = false;
  }

  function shareOnTelegram() {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(shareUrl, "_blank");
    showShareMenu = false;
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      showShareMenu = false;
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".share-container")) {
      showShareMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="fixed {top} {right} z-50 share-container">
  <!-- Share Button -->
  <button
    on:click={toggleShareMenu}
    class="flex items-center justify-center w-12 h-12 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full text-white hover:bg-gray-700/90 transition-all duration-300 group"
    title="Share Event"
  >
    <svg
      class="w-6 h-6 transition-transform duration-300 group-hover:scale-110"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
      ></path>
    </svg>
  </button>

  <!-- Share Menu -->
  {#if showShareMenu}
    <div
      class="absolute top-14 right-0 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-3 min-w-[200px] animate-in slide-in-from-top-2 duration-200"
    >
      <div class="space-y-2">
        <!-- Facebook -->
        <button
          on:click={shareOnFacebook}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
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
          on:click={shareOnTwitter}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
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
          on:click={shareOnWhatsApp}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
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
          on:click={shareOnTelegram}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
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

        <!-- QR Code -->
        <button
          on:click={openQRModal}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
        >
          <svg
            class="w-5 h-5 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          <span class="text-sm">QR Code</span>
        </button>

        <!-- Copy Link -->
        <button
          on:click={copyToClipboard}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
        >
          <svg
            class="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
          <span class="text-sm">Copy Link</span>
        </button>

        <!-- Divider -->
        <div class="border-t border-gray-600 my-2"></div>

        <!-- More Options -->
        <button
          on:click={openShareModal}
          class="flex items-center gap-3 w-full px-3 py-2 text-left text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200"
        >
          <svg
            class="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            ></path>
          </svg>
          <span class="text-sm">More Options</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Share Modal -->
  {#if showShareModal}
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between p-6 border-b border-gray-700"
        >
          <h3 class="text-xl font-bold text-white">Share Event</h3>
          <button
            on:click={closeShareModal}
            class="text-gray-400 hover:text-white transition-colors"
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
              ></path>
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-4">
          <!-- Event Info -->
          <div class="bg-gray-700/50 rounded-lg p-4">
            <h4 class="font-semibold text-white mb-2">{title}</h4>
            <p class="text-gray-300 text-sm">{description}</p>
          </div>

          <!-- Additional Sharing Options -->
          <div class="space-y-3">
            <h5 class="text-white font-medium">Share via:</h5>

            <!-- Email -->
            <button
              on:click={() => {
                const subject = encodeURIComponent(
                  `Check out this event: ${title}`
                );
                const body = encodeURIComponent(`${description}\n\n${url}`);
                window.open(`mailto:?subject=${subject}&body=${body}`);
                closeShareModal();
              }}
              class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-6 h-6 text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                />
              </svg>
              <span>Email</span>
            </button>

            <!-- SMS -->
            <button
              on:click={() => {
                const message = encodeURIComponent(`${title} - ${url}`);
                window.open(`sms:?body=${message}`);
                closeShareModal();
              }}
              class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-6 h-6 text-green-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                />
              </svg>
              <span>SMS</span>
            </button>

            <!-- LinkedIn -->
            <button
              on:click={() => {
                const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                window.open(shareUrl, "_blank", "width=600,height=400");
                closeShareModal();
              }}
              class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
              <span>LinkedIn</span>
            </button>

            <!-- Reddit -->
            <button
              on:click={() => {
                const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
                window.open(shareUrl, "_blank", "width=600,height=400");
                closeShareModal();
              }}
              class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-6 h-6 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
                />
              </svg>
              <span>Reddit</span>
            </button>

            <!-- Pinterest -->
            <button
              on:click={() => {
                const shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`;
                window.open(shareUrl, "_blank", "width=600,height=400");
                closeShareModal();
              }}
              class="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
            >
              <svg
                class="w-6 h-6 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"
                />
              </svg>
              <span>Pinterest</span>
            </button>
          </div>

          <!-- Copy Link Section -->
          <div class="border-t border-gray-600 pt-4">
            <h5 class="text-white font-medium mb-3">Or copy the link:</h5>
            <div class="flex gap-2">
              <input
                type="text"
                value={url}
                readonly
                class="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              />
              <button
                on:click={() => {
                  copyToClipboard();
                  closeShareModal();
                }}
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- QR Code Modal -->
  {#if showQRModal}
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between p-6 border-b border-gray-700"
        >
          <h3 class="text-xl font-bold text-white">QR Code</h3>
          <button
            on:click={closeQRModal}
            class="text-gray-400 hover:text-white transition-colors"
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
              ></path>
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-4">
          <!-- Event Info -->
          <div class="bg-gray-700/50 rounded-lg p-4">
            <h4 class="font-semibold text-white mb-2">{title}</h4>
            <p class="text-gray-300 text-sm">{description}</p>
          </div>

          <!-- QR Code Display -->
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
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              on:click={() => {
                // Download QR code
                const link = document.createElement("a");
                link.href = qrCodeUrl;
                link.download = `qr-code-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Download QR Code
            </button>
            <button
              on:click={closeQRModal}
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes slide-in-from-top-2 {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-in {
    animation: slide-in-from-top-2 0.2s ease-out;
  }
</style>

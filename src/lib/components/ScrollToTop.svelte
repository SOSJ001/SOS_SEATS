<script>
  import { onMount } from "svelte";

  let showButton = false;

  onMount(() => {
    const handleScroll = () => {
      showButton = window.scrollY > 300;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
</script>

{#if showButton}
  <button
    on:click={scrollToTop}
    class="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg hover:from-purple-500 hover:to-cyan-400 transition-all duration-300 hover:scale-110"
    aria-label="Scroll to top"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      ></path>
    </svg>
  </button>
{/if}

<script>
  // Props can be added later for dynamic content
</script>

<section
  class="relative flex flex-col items-center justify-center min-h-[50vh] py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0A0A0A] to-[#18122B]"
>
  <h1
    class="text-4xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent drop-shadow-lg mb-4 animate-fade-in"
  >
    Revolutionizing Event Ticketing with <span class="block md:inline"
      >Blockchain</span
    >
  </h1>
  <p
    class="text-lg md:text-xl text-gray-300 text-center max-w-2xl mb-8 animate-fade-in delay-100"
  >
    Experience secure, transparent, and engaging event management from creation
    to sale, powered by cutting-edge technology.
  </p>
  <div
    class="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-in delay-200 w-full max-w-md sm:max-w-none justify-center"
  >
    <button
      class="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        ></path>
      </svg>
      Create Your Event
    </button>
    <a
      href="/marketplace"
      class="px-6 py-3 rounded-lg font-semibold border border-[#00F5FF] text-[#00F5FF] bg-transparent hover:bg-[#18122B] hover:scale-105 transition-transform flex items-center justify-center gap-2"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        ></path>
      </svg>
      Explore Events
    </a>
  </div>
  <div class="w-full flex justify-center animate-fade-in delay-300">
    <!-- Hero image/video placeholder -->
    <div
      class="rounded-xl overflow-hidden shadow-2xl border-4 border-[#9D4EDD]/40 bg-[#18122B] max-w-xl w-full mx-4 sm:mx-0"
    >
      <img
        src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"
        alt="Event Hero"
        class="object-cover w-full h-64 md:h-80 opacity-90"
      />
    </div>
  </div>
</section>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .animate-fade-in {
    animation: fade-in 1s cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  .delay-100 {
    animation-delay: 0.1s;
  }
  .delay-200 {
    animation-delay: 0.2s;
  }
  .delay-300 {
    animation-delay: 0.3s;
  }
</style>

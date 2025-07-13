<script>
  // Simple animated counter logic
  import { onMount } from "svelte";
  let events = 0,
    tickets = 0,
    uptime = 0;
  onMount(() => {
    const animate = (target, setter, max, speed = 20) => {
      let val = 0;
      const interval = setInterval(() => {
        val += Math.ceil(max / 40);
        if (val >= max) {
          setter(max);
          clearInterval(interval);
        } else {
          setter(val);
        }
      }, speed);
    };
    animate(500, (v) => (events = v), 500);
    animate(10000, (v) => (tickets = v), 10000, 1);
    animate(99, (v) => (uptime = v), 99, 40);
  });
</script>

<section class="py-8 bg-transparent">
  <h2
    class="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent drop-shadow-lg"
  >
    What Our Users Say
  </h2>
  <div class="container mx-auto px-4">
    <!-- Animated Counters -->
    <div
      class="flex flex-col md:flex-row justify-center items-center gap-8 mb-12"
    >
      <div class="flex flex-col items-center">
        <span class="text-4xl md:text-5xl font-extrabold text-[#00F5FF]"
          >{events}+</span
        >
        <span class="text-lg text-gray-300 mt-2">EVENTS CREATED</span>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-4xl md:text-5xl font-extrabold text-[#9D4EDD]"
          >{tickets.toLocaleString()}+</span
        >
        <span class="text-lg text-gray-300 mt-2">TICKETS SOLD</span>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-4xl md:text-5xl font-extrabold text-[#FFD700]"
          >{uptime}%</span
        >
        <span class="text-lg text-gray-300 mt-2">UPTIME RELIABILITY</span>
      </div>
    </div>
    <!-- Testimonials -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        class="rounded-xl p-8 shadow-lg bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#00F5FF]/30 flex flex-col items-center text-center"
      >
        <img
          src="https://randomuser.me/api/portraits/women/44.jpg"
          alt="Jane Toe"
          class="w-16 h-16 rounded-full mb-4 border-2 border-[#00F5FF]"
        />
        <p class="text-gray-200 mb-4">
          "TicketVerse made event management a breeze! The blockchain security
          gave me so much confidence."
        </p>
        <span class="font-semibold text-[#00F5FF]">Jane Toe</span>
        <span class="text-xs text-gray-400">Event Organizer</span>
      </div>
      <div
        class="rounded-xl p-8 shadow-lg bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#9D4EDD]/30 flex flex-col items-center text-center"
      >
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="John Smith"
          class="w-16 h-16 rounded-full mb-4 border-2 border-[#9D4EDD]"
        />
        <p class="text-gray-200 mb-4">
          "The mobile experience is fantastic, and buying tickets is incredibly
          fast and secure. Highly recommend!"
        </p>
        <span class="font-semibold text-[#9D4EDD]">John Smith</span>
        <span class="text-xs text-gray-400">Attendee</span>
      </div>
      <div
        class="rounded-xl p-8 shadow-lg bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#FFD700]/30 flex flex-col items-center text-center"
      >
        <img
          src="https://randomuser.me/api/portraits/women/65.jpg"
          alt="Mary Lee"
          class="w-16 h-16 rounded-full mb-4 border-2 border-[#FFD700]"
        />
        <p class="text-gray-200 mb-4">
          "The support team is responsive and the platform is super easy to use.
          Love the instant payouts!"
        </p>
        <span class="font-semibold text-[#FFD700]">Mary Lee</span>
        <span class="text-xs text-gray-400">Event Host</span>
      </div>
    </div>
  </div>
</section>

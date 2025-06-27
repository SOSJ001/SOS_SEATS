<script>
  import { Button } from "flowbite-svelte";
  import { AnimatedHeadline } from "svelte-animated-headline";
  import { onMount } from "svelte";
  
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<div class="relative h-screen w-screen bg-brand-dark overflow-hidden">
  <!-- Enhanced background with gradient overlay -->
  <div class="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark-secondary to-brand-dark-tertiary">
    <!-- Animated background elements -->
    <div class="absolute top-20 left-20 w-32 h-32 bg-brand-yellow/10 rounded-full blur-xl animate-pulse-slow"></div>
    <div class="absolute bottom-32 right-32 w-48 h-48 bg-brand-accent/10 rounded-full blur-xl animate-pulse-slow" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/3 w-24 h-24 bg-brand-yellow/5 rounded-full blur-lg animate-bounce-gentle"></div>
  </div>
  
  <!-- Geometric pattern overlay -->
  <div class="absolute inset-0 opacity-5">
    <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>

  <!-- Main content -->
  <div class="relative z-10 flex items-center justify-center h-full px-4">
    <div class="text-center max-w-4xl mx-auto">
      <!-- Hero text with enhanced styling -->
      <div class="space-y-6 animate-slide-up">
        <!-- Action word with animation -->
        <div class="text-brand-yellow font-display text-4xl md:text-6xl font-bold">
          {#if mounted}
            <AnimatedHeadline
              texts={["Create", "Get", "Share"]}
              y={0}
              wait={0}
              slide={100}
              fade={3000}
            />
          {/if}
        </div>
        
        <!-- Main headline -->
        <div class="text-white font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
          YOUR TICKET <br />
          <span class="text-transparent bg-gradient-to-r from-brand-yellow to-brand-accent bg-clip-text">
            OR INVITATION
          </span> FOR
        </div>
        
        <!-- Event types with animation -->
        <div class="text-brand-yellow font-display text-2xl md:text-4xl font-semibold">
          {#if mounted}
            <AnimatedHeadline
              texts={[
                "Sports Events",
                "Weddings",
                "Birthdays",
                "Conferences",
                "Pool Parties",
                "House Parties",
                "Concerts",
                "More Events"
              ]}
              y={20}
              wait={0}
              slide={500}
              fade={1500}
            />
          {/if}
        </div>
        
        <!-- Subtitle -->
        <p class="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-body">
          Safe, secure, reliable ticketing. Your 
          <span class="text-brand-yellow font-semibold">
            {#if mounted}
              <AnimatedHeadline
                texts={["ticket", "invitation"]}
                y={-20}
                wait={0}
                slide={100}
                fade={2000}
              />
            {/if}
          </span>
          to live satisfying entertainment!
        </p>
        
        <!-- Enhanced CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <button class="btn-primary group">
            <span class="flex items-center gap-2">
              Get Started
              <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </span>
          </button>
          
          <button class="btn-secondary">
            Learn More
          </button>
        </div>
        
        <!-- Feature highlights -->
        <div class="flex flex-wrap justify-center gap-6 pt-12 text-sm text-gray-400">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Secure & Reliable</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Easy to Use</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-yellow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Instant Delivery</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
    <svg class="w-6 h-6 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
    </svg>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Alkatra:wght@400;500;600;700&display=swap");
</style>
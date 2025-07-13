<script>
  //@ts-nocheck
  import Banner from "$lib/components/Banner.svelte";
  import Search from "$lib/components/Search.svelte";
  import michael from "$lib/assets/michael.jpeg";
  import jnice from "$lib/assets/jnice.jpeg";
  import jenny from "$lib/assets/jenny.jpeg";
  import HeroSection from "$lib/components/HeroSection.svelte";
  import KeyFeaturesSection from "$lib/components/KeyFeaturesSection.svelte";
  import HowItWorksSection from "$lib/components/HowItWorksSection.svelte";
  import TestimonialsSection from "$lib/components/TestimonialsSection.svelte";
  import TrustBadgesSection from "$lib/components/TrustBadgesSection.svelte";
  import PricingSection from "$lib/components/PricingSection.svelte";
  import FooterSection from "$lib/components/FooterSection.svelte";
  import TeamSection from "$lib/components/TeamSection.svelte";
  import ScrollAnimation from "$lib/components/ScrollAnimation.svelte";
  import ScrollToTop from "$lib/components/ScrollToTop.svelte";

  export let data;
</script>

<div class="bg-gray-800 items-center text-white overflow-hidden">
  <div class="w-full">
    <section id="home">
      <ScrollAnimation delay={0}>
        <HeroSection />
      </ScrollAnimation>
    </section>

    <section id="features">
      <ScrollAnimation delay={100}>
        <KeyFeaturesSection />
      </ScrollAnimation>
    </section>

    <section id="how-it-works">
      <ScrollAnimation delay={200}>
        <HowItWorksSection />
      </ScrollAnimation>
    </section>

    <section id="testimonials">
      <ScrollAnimation delay={300}>
        <TestimonialsSection {michael} {jnice} {jenny} />
      </ScrollAnimation>
    </section>

    <section id="trust">
      <ScrollAnimation delay={400}>
        <TrustBadgesSection />
      </ScrollAnimation>
    </section>

    <section id="pricing">
      <ScrollAnimation delay={500}>
        <PricingSection />
      </ScrollAnimation>
    </section>

    <section id="team">
      <ScrollAnimation delay={600}>
        <TeamSection {michael} {jnice} {jenny} />
      </ScrollAnimation>
    </section>

    <section id="contact">
      <ScrollAnimation delay={200}>
        <FooterSection />
      </ScrollAnimation>
    </section>
  </div>

  <!-- Scroll to top button -->
  <ScrollToTop />
</div>

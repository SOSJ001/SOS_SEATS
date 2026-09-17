<script>
  // @ts-nocheck
  /** Desktop left hero panel from HI-FI 96:20. Scales with 100dvh. */
  import AuthIllustration from "$lib/components/auth/AuthIllustration.svelte";
  import PublicIcon from "$lib/components/public/PublicIcon.svelte";
</script>

<aside
  class="hidden lg:flex relative w-1/2 h-screen h-[100dvh] sticky top-0 shrink-0 flex-col overflow-hidden text-white"
>
  <img
    src="/hifi/auth/hero.jpg"
    alt=""
    class="absolute inset-0 w-full h-full object-cover"
  />
  <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>

  <!--
    Illustration instance crops master to 480×580 @ (56,56) in 640×900.
    Keep 480:580 aspect; AuthIllustration scales that crop uniformly.
  -->
  <div
    class="absolute left-[8.75%] top-[6.22%] z-[1] pointer-events-none overflow-hidden isolate aspect-[480/580]"
    style="width: min(75%, calc(100dvh * 8 / 15))"
  >
    <AuthIllustration />
  </div>

  <!-- Brand lockup 96:22 — bottom 19.89% of hero -->
  <div
    class="absolute left-[8.75%] bottom-[19.89%] z-[2] flex flex-col gap-2.5 items-start"
  >
    <div class="flex items-center gap-2.5 overflow-hidden">
      <span
        class="w-2 h-[clamp(28px,4vh,36px)] rounded-[2px] bg-brand shrink-0"
        aria-hidden="true"
      ></span>
      <p
        class="font-logo font-black text-[clamp(28px,3.5vw,40px)] leading-[1.05] tracking-[2px] m-0 whitespace-nowrap"
      >
        <span class="text-brand">SOS</span><span class="text-white"> SEATS</span>
      </p>
    </div>
    <p class="text-sm leading-[1.5] text-white/80 m-0 max-w-[400px]">
      Sierra Leone's premier event ticketing platform
    </p>
  </div>

  <!-- Trust strip 726:1461 — 56px / 900 = 6.22% -->
  <div
    class="absolute bottom-0 left-0 right-0 z-[2] flex h-[6.22%] min-h-[56px] items-center justify-between border border-white/10 bg-white/5 px-10 py-3.5 shadow-[0px_-8px_24px_0px_rgba(0,0,0,0.15)] backdrop-blur-[12px]"
  >
    <div class="flex items-center gap-2">
      <span
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10"
        aria-hidden="true"
      >
        <PublicIcon name="shield-check" size={16} color="#fff" strokeWidth={2} />
      </span>
      <p class="m-0 whitespace-nowrap text-xs font-normal leading-none text-white/80">
        Secure event check-in
      </p>
    </div>
    <div class="flex items-center gap-2">
      <span
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10"
        aria-hidden="true"
      >
        <PublicIcon name="lock" size={16} color="#fff" strokeWidth={2} />
      </span>
      <p class="m-0 whitespace-nowrap text-xs font-normal leading-none text-white/80">
        Mobile-first access
      </p>
    </div>
  </div>
</aside>

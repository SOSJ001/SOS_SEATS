<script>
  // @ts-nocheck
  /**
   * Auth hero geometric overlay (HI-FI auth-illustration + Animation Spec 959:1880).
   * Figma instance 957:2110 crops the 520×700 master to a 480×580 viewport (not stretch).
   * Scale that crop uniformly to the parent; overflow clips rings into arcs.
   * Entrance on mount, then idle. Reduced-motion: static final pose.
   */
  import { onMount } from "svelte";

  export let className = "";

  let frame;
  let canvasScale = 1;
  let isEntering = false;
  let isIdle = false;
  let reduceMotion = false;

  const VIEW_W = 480;

  $: phaseClass = reduceMotion
    ? "is-static"
    : isIdle
      ? "is-idle"
      : isEntering
        ? "is-entering"
        : "is-waiting";

  function updateScale() {
    if (!frame) return;
    const pw = frame.clientWidth;
    const ph = frame.clientHeight;
    if (pw <= 0 || ph <= 0) return;
    // Uniform scale of the 480×580 crop (parent aspect locks VIEW_W:VIEW_H)
    canvasScale = pw / VIEW_W;
  }

  onMount(() => {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    if (frame) ro.observe(frame);

    let enterRaf;
    let idleTimer;
    if (!reduceMotion && frame) {
      enterRaf = requestAnimationFrame(() => {
        isEntering = true;
      });
      idleTimer = setTimeout(() => {
        isIdle = true;
      }, 1800);
    }

    return () => {
      ro.disconnect();
      if (enterRaf) cancelAnimationFrame(enterRaf);
      if (idleTimer) clearTimeout(idleTimer);
    };
  });
</script>

<div
  bind:this={frame}
  class="auth-illus absolute inset-0 h-full w-full overflow-clip pointer-events-none {phaseClass} {className}"
  aria-hidden="true"
>
  <div
    class="auth-illus-canvas absolute left-0 top-0 h-[700px] w-[520px] origin-top-left"
    style="transform: scale({canvasScale})"
  >
    <!-- Rings (Figma 957:1854 idle layout) -->
    <img
      class="auth-ring auth-ring-lg absolute left-[220px] top-[-80px] h-[400px] w-[400px] mix-blend-screen"
      src="/hifi/auth/illustration/ring-large.svg"
      alt=""
    />
    <img
      class="auth-ring auth-ring-md absolute left-[-60px] top-[200px] h-[250px] w-[250px] mix-blend-screen"
      src="/hifi/auth/illustration/ring-medium.svg"
      alt=""
    />
    <img
      class="auth-ring auth-ring-sm absolute left-[350px] top-[480px] h-[150px] w-[150px] mix-blend-screen"
      src="/hifi/auth/illustration/ring-small.svg"
      alt=""
    />

    <!-- Diagonal lines -->
    <div
      class="auth-line auth-line-1 absolute left-[80px] top-[49.15px] flex h-[200.233px] w-[94.789px] items-center justify-center"
    >
      <div class="-rotate-[25deg] h-[220px] w-0.5 rounded-[1px] bg-[rgba(255,90,31,0.4)]"></div>
    </div>
    <div
      class="auth-line auth-line-2 absolute left-[288.44px] top-[100px] flex h-[169.658px] w-[62.973px] items-center justify-center"
    >
      <div class="rotate-[20deg] h-[180px] w-[1.5px] rounded-[1px] bg-white/30"></div>
    </div>
    <div
      class="auth-line auth-line-3 absolute left-[200px] top-[398.85px] flex h-[164.978px] w-[116.354px] items-center justify-center"
    >
      <div class="-rotate-[35deg] h-[200px] w-0.5 rounded-[1px] bg-[rgba(255,90,31,0.36)]"></div>
    </div>
    <div
      class="auth-line auth-line-4 absolute left-[408.59px] top-[300px] flex h-[154.936px] w-[42.86px] items-center justify-center"
    >
      <div class="rotate-[15deg] h-[160px] w-[1.5px] rounded-[1px] bg-[rgba(255,255,255,0.24)]"></div>
    </div>

    <!-- Accent dots -->
    <img class="auth-dot auth-dot-1 absolute left-[160px] top-[100px] h-4 w-4" src="/hifi/auth/illustration/accent-1.svg" alt="" />
    <img class="auth-dot auth-dot-2 absolute left-[400px] top-[200px] h-2.5 w-2.5" src="/hifi/auth/illustration/accent-2.svg" alt="" />
    <img class="auth-dot auth-dot-3 absolute left-[80px] top-[450px] h-3 w-3" src="/hifi/auth/illustration/accent-3.svg" alt="" />
    <img class="auth-dot auth-dot-4 absolute left-[300px] top-[550px] h-2 w-2" src="/hifi/auth/illustration/accent-4.svg" alt="" />
    <img class="auth-dot auth-dot-5 absolute left-[440px] top-[80px] h-[14px] w-[14px]" src="/hifi/auth/illustration/accent-5.svg" alt="" />
    <img class="auth-dot auth-dot-6 absolute left-[50px] top-[180px] h-1.5 w-1.5" src="/hifi/auth/illustration/accent-6.svg" alt="" />

    <!-- Crosshairs -->
    <div class="auth-cross auth-cross-1 absolute left-[250px] top-[80px] h-[18px] w-[18px]">
      <span class="absolute left-0 top-[8.25px] h-[1.5px] w-full bg-white/50"></span>
      <span class="absolute left-[8.25px] top-0 h-full w-[1.5px] bg-white/50"></span>
    </div>
    <div class="auth-cross auth-cross-2 absolute left-[100px] top-[340px] h-[14px] w-[14px]">
      <span class="absolute left-0 top-[6.25px] h-[1.5px] w-full bg-white/45"></span>
      <span class="absolute left-[6.25px] top-0 h-full w-[1.5px] bg-white/45"></span>
    </div>
    <div class="auth-cross auth-cross-3 absolute left-[420px] top-[420px] h-4 w-4">
      <span class="absolute left-0 top-[7.25px] h-[1.5px] w-full bg-white/35"></span>
      <span class="absolute left-[7.25px] top-0 h-full w-[1.5px] bg-white/35"></span>
    </div>

    <!-- Sparkle stars -->
    <img class="auth-star auth-star-1 absolute left-[320px] top-[50px] h-[14px] w-[14px]" src="/hifi/auth/illustration/star-1.svg" alt="" />
    <img class="auth-star auth-star-2 absolute left-[50px] top-[300px] h-2.5 w-2.5" src="/hifi/auth/illustration/star-2.svg" alt="" />
    <img class="auth-star auth-star-3 absolute left-[460px] top-[350px] h-3 w-3" src="/hifi/auth/illustration/star-3.svg" alt="" />
    <img class="auth-star auth-star-4 absolute left-[180px] top-[580px] h-4 w-4" src="/hifi/auth/illustration/star-4.svg" alt="" />
  </div>
</div>

<style>
  .auth-illus-canvas > * {
    will-change: transform, opacity;
  }

  /* —— Waiting (pre-entrance) —— */
  .is-waiting .auth-ring,
  .is-waiting .auth-line,
  .is-waiting .auth-dot,
  .is-waiting .auth-cross,
  .is-waiting .auth-star {
    opacity: 0;
  }
  .is-waiting .auth-ring {
    transform: scale(0.6);
  }
  .is-waiting .auth-line > div {
    transform: scaleY(0);
    transform-origin: center top;
  }
  .is-waiting .auth-dot,
  .is-waiting .auth-star {
    transform: scale(0);
  }

  /* —— Entrance keyframes —— */
  @keyframes auth-enter-ring {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes auth-enter-line {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes auth-enter-line-bar {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
  @keyframes auth-enter-pop {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    70% {
      opacity: 1;
      transform: scale(1.12);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes auth-enter-cross {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes auth-enter-star {
    0% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    70% {
      opacity: 0.6;
      transform: scale(1.1) rotate(40deg);
    }
    100% {
      opacity: 0.6;
      transform: scale(1) rotate(0deg);
    }
  }

  .is-entering .auth-ring-lg {
    animation: auth-enter-ring 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  }
  .is-entering .auth-ring-md {
    animation: auth-enter-ring 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
  }
  .is-entering .auth-ring-sm {
    animation: auth-enter-ring 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
  }
  .is-entering .auth-line {
    animation: auth-enter-line 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .is-entering .auth-line > div {
    transform-origin: center top;
    animation: auth-enter-line-bar 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .is-entering .auth-line-1,
  .is-entering .auth-line-1 > div {
    animation-delay: 0.5s;
  }
  .is-entering .auth-line-2,
  .is-entering .auth-line-2 > div {
    animation-delay: 0.65s;
  }
  .is-entering .auth-line-3,
  .is-entering .auth-line-3 > div {
    animation-delay: 0.8s;
  }
  .is-entering .auth-line-4,
  .is-entering .auth-line-4 > div {
    animation-delay: 0.95s;
  }
  .is-entering .auth-dot {
    animation: auth-enter-pop 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .is-entering .auth-dot-1 {
    animation-delay: 0.6s;
  }
  .is-entering .auth-dot-2 {
    animation-delay: 0.72s;
  }
  .is-entering .auth-dot-3 {
    animation-delay: 0.84s;
  }
  .is-entering .auth-dot-4 {
    animation-delay: 0.96s;
  }
  .is-entering .auth-dot-5 {
    animation-delay: 1.08s;
  }
  .is-entering .auth-dot-6 {
    animation-delay: 1.2s;
  }
  .is-entering .auth-cross {
    animation: auth-enter-cross 0.6s ease-out both;
  }
  .is-entering .auth-cross-1 {
    animation-delay: 0.8s;
  }
  .is-entering .auth-cross-2 {
    animation-delay: 1s;
  }
  .is-entering .auth-cross-3 {
    animation-delay: 1.2s;
  }
  .is-entering .auth-star {
    animation: auth-enter-star 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .is-entering .auth-star-1 {
    animation-delay: 1s;
  }
  .is-entering .auth-star-2 {
    animation-delay: 1.15s;
  }
  .is-entering .auth-star-3 {
    animation-delay: 1.3s;
  }
  .is-entering .auth-star-4 {
    animation-delay: 1.45s;
  }

  /*
   * Idle loop — stay on Figma rest layout (957:1854).
   * Motion tracks from the component: tiny linear ring/cross drift,
   * line opacity pulse, ±5px dot float, star twinkle 15%↔60%.
   */
  @keyframes auth-idle-ring-lg {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-2.5deg);
    }
  }
  @keyframes auth-idle-ring-md {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(3.333deg);
    }
  }
  @keyframes auth-idle-ring-sm {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-4.167deg);
    }
  }
  @keyframes auth-idle-line-pulse {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes auth-idle-dot-up {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  @keyframes auth-idle-dot-down {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(5px);
    }
  }
  @keyframes auth-idle-cross-cw {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(15deg);
    }
  }
  @keyframes auth-idle-cross-ccw {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-15deg);
    }
  }
  @keyframes auth-idle-twinkle {
    0%,
    100% {
      opacity: 0.15;
    }
    50% {
      opacity: 0.6;
    }
  }

  .is-idle .auth-ring,
  .is-idle .auth-line,
  .is-idle .auth-dot,
  .is-idle .auth-cross,
  .is-idle .auth-star {
    opacity: 1;
    transform: none;
  }
  .is-idle .auth-line > div {
    transform: scaleY(1);
  }
  .is-idle .auth-ring-lg {
    animation: auth-idle-ring-lg 12s linear infinite alternate;
  }
  .is-idle .auth-ring-md {
    animation: auth-idle-ring-md 12s linear infinite alternate;
  }
  .is-idle .auth-ring-sm {
    animation: auth-idle-ring-sm 12s linear infinite alternate;
  }
  .is-idle .auth-line {
    animation: auth-idle-line-pulse 4s ease-in-out infinite;
  }
  .is-idle .auth-line-2 {
    animation-delay: 1s;
  }
  .is-idle .auth-line-3 {
    animation-delay: 2s;
  }
  .is-idle .auth-line-4 {
    animation-delay: 3s;
  }
  .is-idle .auth-dot-1,
  .is-idle .auth-dot-3,
  .is-idle .auth-dot-5 {
    animation: auth-idle-dot-up 3s ease-in-out infinite;
  }
  .is-idle .auth-dot-2,
  .is-idle .auth-dot-4,
  .is-idle .auth-dot-6 {
    animation: auth-idle-dot-down 3.5s ease-in-out infinite;
  }
  .is-idle .auth-dot-2 {
    animation-delay: 0.4s;
  }
  .is-idle .auth-dot-3 {
    animation-delay: 0.8s;
  }
  .is-idle .auth-dot-4 {
    animation-delay: 1.2s;
  }
  .is-idle .auth-dot-5 {
    animation-delay: 1.6s;
  }
  .is-idle .auth-dot-6 {
    animation-delay: 2s;
  }
  .is-idle .auth-cross-1,
  .is-idle .auth-cross-3 {
    animation: auth-idle-cross-ccw 12s linear infinite alternate;
  }
  .is-idle .auth-cross-2 {
    animation: auth-idle-cross-cw 12s linear infinite alternate;
  }
  .is-idle .auth-star {
    animation: auth-idle-twinkle 1.6s ease-in-out infinite;
  }
  .is-idle .auth-star-2 {
    animation-delay: 0.4s;
  }
  .is-idle .auth-star-3 {
    animation-delay: 0.8s;
  }
  .is-idle .auth-star-4 {
    animation-delay: 1.2s;
  }

  /* —— Static (reduced motion) —— */
  .is-static .auth-ring,
  .is-static .auth-line,
  .is-static .auth-dot,
  .is-static .auth-cross,
  .is-static .auth-star {
    opacity: 1;
    transform: none;
    animation: none !important;
  }
  .is-static .auth-line > div {
    transform: scaleY(1);
  }
  .is-static .auth-star {
    opacity: 0.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .auth-ring,
    .auth-line,
    .auth-dot,
    .auth-cross,
    .auth-star,
    .auth-line > div {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
</style>

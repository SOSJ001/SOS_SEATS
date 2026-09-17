<script>
  // @ts-nocheck
  /**
   * Shared stage illustration + motion (Animation Spec 912:1852).
   * Desktop: HI-FI empty stage 520×360. Mobile: 884:60 / 882:1768 at 310×280.
   * Entrance once on intersect, then idle. Reduced-motion: static.
   */
  import { onMount } from "svelte";

  /** Optional extra classes on the outer frame (e.g. max width). */
  export let className = "";
  /** `"desktop"` (default) or `"mobile"` for 884:60 geometry. */
  export let variant = "desktop";

  let stageFrame;
  let isEntering = false;
  let isIdle = false;
  let reduceMotion = false;

  $: isMobile = variant === "mobile";
  $: stagePhaseClass = reduceMotion
    ? "is-static"
    : isIdle
      ? "is-idle"
      : isEntering
        ? "is-entering"
        : "is-waiting";

  onMount(() => {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !stageFrame) return;

    let idleTimer;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit || isEntering || isIdle) return;
        isEntering = true;
        observer.disconnect();
        idleTimer = setTimeout(() => {
          isIdle = true;
        }, 2500);
      },
      { threshold: 0.35 },
    );

    observer.observe(stageFrame);

    return () => {
      observer.disconnect();
      if (idleTimer) clearTimeout(idleTimer);
    };
  });
</script>

{#if isMobile}
  <div
    bind:this={stageFrame}
    class="empty-stage-frame is-mobile relative w-full overflow-hidden rounded-[16px] bg-[#fef5f0] {stagePhaseClass} {className}"
    style="aspect-ratio: 310 / 280"
    aria-hidden="true"
  >
    <div class="empty-stage-canvas absolute left-0 top-0 h-[280px] w-[310px] origin-top-left">
      <!-- Ambient blobs (884:60) -->
      <div
        class="empty-blob absolute left-[119px] top-[29px] size-[72px] rounded-full bg-[rgba(255,90,31,0.08)]"
      ></div>
      <div
        class="empty-blob absolute -left-[30px] top-[35px] size-[119px] rounded-full bg-[rgba(255,90,31,0.08)]"
      ></div>
      <div
        class="empty-blob absolute left-[200px] top-[184px] size-[95px] rounded-full bg-[rgba(255,90,31,0.06)]"
      ></div>

      <!-- Stage -->
      <div
        class="empty-stage-platform absolute left-[48px] top-[193px] h-12 w-[215px] rounded-[10px] bg-slate-public shadow-public-card"
      ></div>
      <div
        class="empty-stage-surface absolute left-[54px] top-[193px] h-0.5 w-[203px] rounded-sm bg-brand"
      ></div>

      <!-- Spotlights -->
      <div
        class="absolute left-[95px] top-[82px] flex h-[101px] w-[38px] items-center justify-center"
      >
        <div class="empty-spot-tilt-left flex-none">
          <div
            class="empty-spot empty-spot-l h-[107px] w-0.5 rounded-[1px] bg-[rgba(255,90,31,0.15)]"
          ></div>
        </div>
      </div>
      <div
        class="empty-spot empty-spot-c absolute left-[154px] top-[71px] h-[119px] w-0.5 rounded-[1px] bg-[rgba(255,90,31,0.1)]"
      ></div>
      <div
        class="absolute left-[163px] top-[83px] flex h-[101px] w-[38px] items-center justify-center"
      >
        <div class="empty-spot-tilt-right flex-none">
          <div
            class="empty-spot empty-spot-r h-[107px] w-0.5 rounded-[1px] bg-[rgba(255,90,31,0.15)]"
          ></div>
        </div>
      </div>

      <!-- Spot bulbs -->
      <div
        class="empty-bulb empty-bulb-l absolute left-[88px] top-[65px] size-2.5 rounded-full bg-[#ff5a1f]"
      ></div>
      <div
        class="empty-bulb empty-bulb-c absolute left-[149px] top-[59px] size-3 rounded-full bg-[#ff5a1f]"
      ></div>
      <div
        class="empty-bulb empty-bulb-r absolute left-[198px] top-[65px] size-2.5 rounded-full bg-[#ff5a1f]"
      ></div>

      <!-- Mic -->
      <div
        class="empty-mic absolute left-[150px] top-[141px] h-[13px] w-[11px] rounded-full bg-[#4a4654]"
      ></div>
      <div
        class="empty-mic absolute left-[154px] top-[151px] h-[42px] w-0.5 bg-[rgba(102,97,115,0.5)]"
      ></div>
      <div
        class="empty-mic absolute left-[148px] top-[191px] h-0.5 w-3.5 rounded-sm bg-[rgba(102,97,115,0.5)]"
      ></div>

      <!-- Preview cards -->
      <div
        class="absolute left-3 top-[90px] flex h-[61px] w-[78px] items-center justify-center"
      >
        <div class="empty-card-tilt-1 flex-none">
          <div
            class="empty-card empty-card-1 flex h-[51px] w-[72px] flex-col overflow-hidden rounded-md border border-paper-border bg-white shadow-public-card"
          >
            <div class="h-7 shrink-0 bg-[rgba(255,90,31,0.08)]"></div>
            <div class="flex flex-col gap-[3px] px-[5px] py-1">
              <div class="h-[3px] w-[45px] rounded-sm bg-[rgba(15,23,41,0.12)]"></div>
              <div class="h-[3px] w-7 rounded-sm bg-[rgba(255,90,31,0.25)]"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute left-[210px] top-[112px] flex h-[58px] w-[77px] items-center justify-center"
      >
        <div class="empty-card-tilt-2 flex-none">
          <div
            class="empty-card empty-card-2 flex h-[51px] w-[72px] flex-col overflow-hidden rounded-md border border-paper-border bg-white shadow-public-card"
          >
            <div class="h-7 shrink-0 bg-[rgba(255,90,31,0.08)]"></div>
            <div class="flex flex-col gap-[3px] px-[5px] py-1">
              <div class="h-[3px] w-[45px] rounded-sm bg-[rgba(15,23,41,0.12)]"></div>
              <div class="h-[3px] w-7 rounded-sm bg-[rgba(255,90,31,0.25)]"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute left-8 top-[208px] flex h-[56px] w-[75px] items-center justify-center"
      >
        <div class="empty-card-tilt-3 flex-none">
          <div
            class="empty-card empty-card-3 flex h-[51px] w-[72px] flex-col overflow-hidden rounded-md border border-paper-border bg-white shadow-public-card"
          >
            <div class="h-7 shrink-0 bg-[rgba(255,90,31,0.08)]"></div>
            <div class="flex flex-col gap-[3px] px-[5px] py-1">
              <div class="h-[3px] w-[45px] rounded-sm bg-[rgba(15,23,41,0.12)]"></div>
              <div class="h-[3px] w-7 rounded-sm bg-[rgba(255,90,31,0.25)]"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute left-[210px] top-[202px] flex h-[57px] w-[76px] items-center justify-center"
      >
        <div class="empty-card-tilt-4 flex-none">
          <div
            class="empty-card empty-card-4 flex h-[51px] w-[72px] flex-col overflow-hidden rounded-md border border-paper-border bg-white shadow-public-card"
          >
            <div class="h-7 shrink-0 bg-[rgba(255,90,31,0.08)]"></div>
            <div class="flex flex-col gap-[3px] px-[5px] py-1">
              <div class="h-[3px] w-[45px] rounded-sm bg-[rgba(15,23,41,0.12)]"></div>
              <div class="h-[3px] w-7 rounded-sm bg-[rgba(255,90,31,0.25)]"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- COMING SOON badge -->
      <div
        class="empty-badge absolute left-[107px] top-[121px] flex items-center gap-1 rounded-full bg-brand px-2.5 py-[5px] text-[8px] font-bold tracking-[0.64px] text-white shadow-[0_4px_12px_-2px_rgba(255,90,31,0.2)]"
      >
        <span class="size-1 rounded-full bg-white"></span>
        COMING SOON
      </div>

      <!-- Sparkles -->
      <div
        class="empty-sparkle empty-sparkle-0 absolute left-[78px] top-[88px] size-1 rounded-sm bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-1 absolute left-[233px] top-[85px] size-0.5 rounded-sm bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-2 absolute left-[262px] top-[148px] size-[3px] rounded-[1.5px] bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-3 absolute left-[42px] top-[172px] size-0.5 rounded-sm bg-brand"
      ></div>
    </div>
  </div>
{:else}
  <div
    bind:this={stageFrame}
    class="empty-stage-frame relative w-full overflow-hidden rounded-[20px] bg-[#fef5f0] {stagePhaseClass} {className}"
    style="aspect-ratio: 520 / 360"
    aria-hidden="true"
  >
    <div class="empty-stage-canvas absolute left-0 top-0 h-[360px] w-[520px] origin-top-left">
      <!-- Ambient blobs -->
      <div
        class="empty-blob absolute -left-[50px] -top-[30px] size-[200px] rounded-full bg-[rgba(255,90,31,0.08)]"
      ></div>
      <div
        class="empty-blob absolute left-[380px] top-[220px] size-[160px] rounded-full bg-[rgba(255,90,31,0.06)]"
      ></div>
      <div
        class="empty-blob absolute left-[200px] -top-[40px] size-[120px] rounded-full bg-[rgba(255,90,31,0.05)]"
      ></div>

      <!-- Stage -->
      <div
        class="empty-stage-platform absolute left-[80px] top-[235px] h-20 w-[360px] rounded-2xl bg-slate-public shadow-public-card"
      ></div>
      <div
        class="empty-stage-surface absolute left-[90px] top-[235px] h-1 w-[340px] rounded-sm bg-brand"
      ></div>

      <!-- Spotlights: L then R wrappers; center beam; stagger L→C→R -->
      <div
        class="absolute left-[160px] top-[49px] flex h-[170px] w-[64px] items-center justify-center"
      >
        <div class="empty-spot-tilt-left flex-none">
          <div
            class="empty-spot empty-spot-l h-[180px] w-[3px] rounded-[2px] bg-[rgba(255,90,31,0.15)]"
          ></div>
        </div>
      </div>
      <div
        class="absolute left-[288px] top-[50px] flex h-[170px] w-[64px] items-center justify-center"
      >
        <div class="empty-spot-tilt-right flex-none">
          <div
            class="empty-spot empty-spot-r h-[180px] w-[3px] rounded-[2px] bg-[rgba(255,90,31,0.15)]"
          ></div>
        </div>
      </div>
      <div
        class="empty-spot empty-spot-c absolute left-[258px] top-[30px] h-[200px] w-1 rounded-[2px] bg-[rgba(255,90,31,0.1)]"
      ></div>

      <!-- Spot bulbs -->
      <div
        class="empty-bulb empty-bulb-l absolute left-[148px] top-5 size-4 rounded-full bg-[#ff5a1f]"
      ></div>
      <div
        class="empty-bulb empty-bulb-r absolute left-[352px] top-5 size-4 rounded-full bg-[#ff5a1f]"
      ></div>
      <div
        class="empty-bulb empty-bulb-c absolute left-[250px] top-2.5 size-5 rounded-full bg-[#ff5a1f]"
      ></div>

      <!-- Mic -->
      <div
        class="empty-mic absolute left-[259px] top-[165px] h-[70px] w-[3px] rounded-[1px] bg-[rgba(102,97,115,0.6)]"
      ></div>
      <div
        class="empty-mic absolute left-[248px] top-[232px] h-1 w-6 rounded-sm bg-[rgba(102,97,115,0.6)]"
      ></div>
      <div
        class="empty-mic absolute left-[251px] top-[148px] h-[22px] w-[18px] rounded-full bg-[#4a4654]"
      ></div>

      <!-- Preview cards: tilt outer, motion on inner -->
      <div
        class="absolute left-5 top-[63px] flex h-[97px] w-[130px] items-center justify-center"
      >
        <div class="empty-card-tilt-1 flex-none">
          <div
            class="empty-card empty-card-1 w-[120px] overflow-hidden rounded-[10px] border border-paper-border bg-paper shadow-public-card"
          >
            <div class="relative h-12 bg-[rgba(255,90,31,0.08)]">
              <div
                class="absolute left-10 top-[22px] h-[3px] w-10 rounded-sm bg-[rgba(255,90,31,0.2)]"
              ></div>
            </div>
            <div class="flex flex-col gap-1 px-2 py-1.5">
              <div class="h-1 w-20 rounded-sm bg-[rgba(15,23,41,0.15)]"></div>
              <div class="h-[3px] w-[50px] rounded-sm bg-[rgba(15,23,41,0.08)]"></div>
              <div class="h-1 w-[35px] rounded-sm bg-[rgba(255,90,31,0.3)]"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute left-[371px] top-[100px] flex h-[93px] w-[128px] items-center justify-center"
      >
        <div class="empty-card-tilt-2 flex-none">
          <div
            class="empty-card empty-card-2 w-[120px] overflow-hidden rounded-[10px] border border-paper-border bg-paper shadow-public-card"
          >
            <div class="relative h-12 bg-[rgba(255,90,31,0.08)]">
              <div
                class="absolute left-10 top-[22px] h-[3px] w-10 rounded-sm bg-[rgba(255,90,31,0.2)]"
              ></div>
            </div>
            <div class="flex flex-col gap-1 px-2 py-1.5">
              <div class="h-1 w-20 rounded-sm bg-[rgba(15,23,41,0.15)]"></div>
              <div class="h-[3px] w-[50px] rounded-sm bg-[rgba(15,23,41,0.08)]"></div>
              <div class="h-1 w-[35px] rounded-sm bg-[rgba(255,90,31,0.3)]"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute left-[54px] top-[260px] flex h-[89px] w-[125px] items-center justify-center"
      >
        <div class="empty-card-tilt-3 flex-none">
          <div
            class="empty-card empty-card-3 w-[120px] overflow-hidden rounded-[10px] border border-paper-border bg-paper shadow-public-card"
          >
            <div class="relative h-12 bg-[rgba(255,90,31,0.08)]">
              <div
                class="absolute left-10 top-[22px] h-[3px] w-10 rounded-sm bg-[rgba(255,90,31,0.2)]"
              ></div>
            </div>
            <div class="flex flex-col gap-1 px-2 py-1.5">
              <div class="h-1 w-20 rounded-sm bg-[rgba(15,23,41,0.15)]"></div>
              <div class="h-[3px] w-[50px] rounded-sm bg-[rgba(15,23,41,0.08)]"></div>
              <div class="h-1 w-[35px] rounded-sm bg-[rgba(255,90,31,0.3)]"></div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="absolute left-[370px] top-[250px] flex h-[91px] w-[127px] items-center justify-center"
      >
        <div class="empty-card-tilt-4 flex-none">
          <div
            class="empty-card empty-card-4 w-[120px] overflow-hidden rounded-[10px] border border-paper-border bg-paper shadow-public-card"
          >
            <div class="relative h-12 bg-[rgba(255,90,31,0.08)]">
              <div
                class="absolute left-10 top-[22px] h-[3px] w-10 rounded-sm bg-[rgba(255,90,31,0.2)]"
              ></div>
            </div>
            <div class="flex flex-col gap-1 px-2 py-1.5">
              <div class="h-1 w-20 rounded-sm bg-[rgba(15,23,41,0.15)]"></div>
              <div class="h-[3px] w-[50px] rounded-sm bg-[rgba(15,23,41,0.08)]"></div>
              <div class="h-1 w-[35px] rounded-sm bg-[rgba(255,90,31,0.3)]"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- COMING SOON badge -->
      <div
        class="empty-badge absolute left-[191px] top-[115px] flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[11px] font-bold tracking-[0.88px] text-white shadow-[0_6px_16px_-2px_rgba(255,90,31,0.25)]"
      >
        <span class="size-1.5 rounded-full bg-white"></span>
        COMING SOON
      </div>

      <!-- Sparkles -->
      <div
        class="empty-sparkle empty-sparkle-0 absolute left-[130px] top-[60px] size-1.5 rounded-[3px] bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-1 absolute left-[390px] top-[55px] size-1 rounded-sm bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-2 absolute left-[440px] top-[160px] size-[5px] rounded-[2.5px] bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-3 absolute left-[70px] top-[200px] size-1 rounded-sm bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-4 absolute left-[310px] top-[45px] size-[3px] rounded-[1.5px] bg-brand"
      ></div>
      <div
        class="empty-sparkle empty-sparkle-5 absolute left-[470px] top-[310px] size-[5px] rounded-[2.5px] bg-brand"
      ></div>
    </div>
  </div>
{/if}

<style>
  .empty-stage-frame {
    container-type: inline-size;
  }

  .empty-stage-canvas {
    transform: scale(calc(100cqi / 520));
  }

  .is-mobile .empty-stage-canvas {
    transform: scale(calc(100cqi / 310));
  }

  .empty-card-tilt-1 {
    transform: rotate(-8deg);
  }

  .empty-card-tilt-2 {
    transform: rotate(6deg);
  }

  .empty-card-tilt-3 {
    transform: rotate(4deg);
  }

  .empty-card-tilt-4 {
    transform: rotate(-5deg);
  }

  .empty-spot-tilt-left {
    transform: rotate(-20deg);
  }

  .empty-spot-tilt-right {
    transform: rotate(20deg);
  }

  /* —— Waiting: hidden at entrance “from” —— */
  .is-waiting .empty-blob,
  .is-waiting .empty-stage-platform,
  .is-waiting .empty-stage-surface,
  .is-waiting .empty-spot,
  .is-waiting .empty-bulb,
  .is-waiting .empty-mic,
  .is-waiting .empty-card,
  .is-waiting .empty-badge,
  .is-waiting .empty-sparkle {
    opacity: 0;
  }

  .is-waiting .empty-blob {
    transform: scale(0.8);
  }

  .is-waiting .empty-stage-platform,
  .is-waiting .empty-stage-surface,
  .is-waiting .empty-mic {
    transform: translateY(40px);
  }

  .is-waiting .empty-mic {
    transform: translateY(15px);
  }

  .is-waiting .empty-spot {
    transform: scaleY(0.3);
    transform-origin: top center;
  }

  .is-waiting .empty-bulb,
  .is-waiting .empty-badge,
  .is-waiting .empty-sparkle {
    transform: scale(0);
  }

  .is-waiting .empty-card-1,
  .is-waiting .empty-card-3 {
    transform: translate(-60px, 25px);
  }

  .is-waiting .empty-card-2,
  .is-waiting .empty-card-4 {
    transform: translate(60px, 25px);
  }

  .is-waiting .empty-card-3 {
    transform: translate(-50px, 30px);
  }

  .is-waiting .empty-card-4 {
    transform: translate(50px, 30px);
  }

  /* —— Entrance keyframes —— */
  @keyframes enter-blob {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes enter-stage {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes enter-beam {
    from {
      opacity: 0;
      transform: scaleY(0.3);
    }
    to {
      opacity: 1;
      transform: scaleY(1);
    }
  }

  @keyframes enter-pop {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    70% {
      opacity: 1;
      transform: scale(1.08);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes enter-mic {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes enter-card-l60 {
    from {
      opacity: 0;
      transform: translate(-60px, 20px);
    }
    to {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  @keyframes enter-card-r60 {
    from {
      opacity: 0;
      transform: translate(60px, 20px);
    }
    to {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  @keyframes enter-card-l50 {
    from {
      opacity: 0;
      transform: translate(-50px, 30px);
    }
    to {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  @keyframes enter-card-r50 {
    from {
      opacity: 0;
      transform: translate(50px, 30px);
    }
    to {
      opacity: 1;
      transform: translate(0, 0);
    }
  }

  @keyframes enter-badge {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    70% {
      opacity: 1;
      transform: scale(1.08);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes enter-sparkle {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    60% {
      opacity: 0.6;
      transform: scale(1.05);
    }
    100% {
      opacity: 0.35;
      transform: scale(1);
    }
  }

  .is-entering .empty-blob {
    animation: enter-blob 0.8s ease-out both;
  }

  .is-entering .empty-stage-platform {
    animation: enter-stage 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  }

  .is-entering .empty-stage-surface {
    animation: enter-stage 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
  }

  .is-entering .empty-spot {
    transform-origin: top center;
    animation: enter-beam 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .is-entering .empty-spot-l {
    animation-delay: 0.5s;
  }

  .is-entering .empty-spot-c {
    animation-delay: 0.55s;
  }

  .is-entering .empty-spot-r {
    animation-delay: 0.6s;
  }

  .is-entering .empty-bulb {
    animation: enter-pop 0.5s ease-out 0.5s both;
  }

  .is-entering .empty-bulb-c {
    animation-delay: 0.55s;
  }

  .is-entering .empty-bulb-r {
    animation-delay: 0.6s;
  }

  .is-entering .empty-mic {
    animation: enter-mic 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
  }

  .is-entering .empty-card-1 {
    animation: enter-card-l60 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
  }

  .is-entering .empty-card-2 {
    animation: enter-card-r60 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;
  }

  .is-entering .empty-card-3 {
    animation: enter-card-l50 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1s both;
  }

  .is-entering .empty-card-4 {
    animation: enter-card-r50 0.7s cubic-bezier(0.16, 1, 0.3, 1) 1.1s both;
  }

  .is-entering .empty-badge {
    animation: enter-badge 0.4s ease-out 0.7s both;
    transform-origin: center;
  }

  .is-entering .empty-sparkle {
    animation: enter-sparkle 0.5s ease-out both;
  }

  .is-entering .empty-sparkle-0 {
    animation-delay: 1.2s;
  }

  .is-entering .empty-sparkle-1 {
    animation-delay: 1.28s;
  }

  .is-entering .empty-sparkle-2 {
    animation-delay: 1.36s;
  }

  .is-entering .empty-sparkle-3 {
    animation-delay: 1.44s;
  }

  .is-entering .empty-sparkle-4 {
    animation-delay: 1.52s;
  }

  .is-entering .empty-sparkle-5 {
    animation-delay: 1.6s;
  }

  /* —— Idle —— */
  @keyframes idle-bulb {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
  }

  @keyframes idle-card {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @keyframes idle-badge {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.03);
    }
  }

  @keyframes idle-sparkle {
    0%,
    100% {
      opacity: 0.15;
    }
    50% {
      opacity: 0.55;
    }
  }

  .is-idle .empty-blob,
  .is-idle .empty-stage-platform,
  .is-idle .empty-stage-surface,
  .is-idle .empty-spot,
  .is-idle .empty-mic {
    opacity: 1;
    transform: none;
  }

  .is-idle .empty-spot {
    transform-origin: top center;
    transform: scaleY(1);
  }

  .is-idle .empty-bulb {
    opacity: 1;
    animation: idle-bulb 2s ease-in-out infinite;
  }

  .is-idle .empty-bulb-c {
    animation-delay: 0.35s;
  }

  .is-idle .empty-bulb-r {
    animation-delay: 0.7s;
  }

  .is-idle .empty-card {
    opacity: 1;
    animation: idle-card 2.4s ease-in-out infinite;
  }

  .is-idle .empty-card-2 {
    animation-delay: 0.6s;
  }

  .is-idle .empty-card-3 {
    animation-delay: 1.2s;
  }

  .is-idle .empty-card-4 {
    animation-delay: 1.8s;
  }

  .is-idle .empty-badge {
    opacity: 1;
    animation: idle-badge 3s ease-in-out infinite;
    transform-origin: center;
  }

  .is-idle .empty-sparkle {
    animation: idle-sparkle 1.6s ease-in-out infinite;
  }

  .is-idle .empty-sparkle-1 {
    animation-delay: 0.2s;
  }

  .is-idle .empty-sparkle-2 {
    animation-delay: 0.4s;
  }

  .is-idle .empty-sparkle-3 {
    animation-delay: 0.55s;
  }

  .is-idle .empty-sparkle-4 {
    animation-delay: 0.75s;
  }

  .is-idle .empty-sparkle-5 {
    animation-delay: 0.95s;
  }

  /* —— Reduced motion / static —— */
  .is-static .empty-blob,
  .is-static .empty-stage-platform,
  .is-static .empty-stage-surface,
  .is-static .empty-spot,
  .is-static .empty-bulb,
  .is-static .empty-mic,
  .is-static .empty-card,
  .is-static .empty-badge {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .is-static .empty-spot {
    transform: scaleY(1);
    transform-origin: top center;
  }

  .is-static .empty-sparkle {
    opacity: 0.4;
    transform: none;
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .empty-blob,
    .empty-stage-platform,
    .empty-stage-surface,
    .empty-spot,
    .empty-bulb,
    .empty-mic,
    .empty-card,
    .empty-badge,
    .empty-sparkle {
      animation: none !important;
    }
  }
</style>

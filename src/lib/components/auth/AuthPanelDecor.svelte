<script>
  // @ts-nocheck
  /**
   * Desktop AuthPanel chrome from HI-FI 55:790 (sign-in only).
   * Updated panel: proportional orange dot-grid only.
   */
</script>

<div
  class="auth-panel-decor pointer-events-none absolute inset-0 overflow-hidden"
  aria-hidden="true"
>
  <!-- Dot grid: 4/640 dot, 28/640 pitch, 24/640 inset @ 8% -->
  <div
    class="absolute inset-0 opacity-[0.08]"
    style="background-image: radial-gradient(circle, #ff5a1f 0.3125cqw, transparent 0.3125cqw); background-size: 4.375cqw 4.375cqw; background-position: 3.75cqw 3.75cqw;"
  ></div>
</div>

<style>
  .auth-panel-decor {
    container-type: size;
  }
</style>

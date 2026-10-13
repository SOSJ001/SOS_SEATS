<script>
  // @ts-nocheck
  /** Staff scope line on the scanner: mobile 1540:7500 / desktop kiosk 1544:4421. */

  /** Masked staff contact (email, or masked phone). */
  export let contact = "";
</script>

<p
  class="m-0 rounded-lg border border-paper-border bg-[#f8f5f2] px-5 py-3 text-[13px] text-ink-secondary"
>
  Staff: <span class="font-bold text-brand">{contact || "-"}</span> · Assigned events only
</p>

<script>
  // @ts-nocheck
  /** Staff landing footer with Sign Out: mobile 424:146 / desktop 530:285. */
  import LogoutConfirmModal from "$lib/components/authed/LogoutConfirmModal.svelte";
  import { authedLogout } from "$lib/components/authed/authedLogout.js";

  /** Masked staff contact (email, or masked phone). Empty once access is gone. */
  export let contact = "";

  let showLogoutConfirm = false;
</script>

<div class="mt-auto">
  <div class="md:hidden flex flex-col items-center gap-3 border-t border-paper-border px-5 pb-6">
    <p
      class="m-0 w-full rounded-lg border border-paper-border bg-paper px-4 py-3 text-center text-[13px] text-ink-secondary"
    >
      {#if contact}
        Staff: <span class="font-bold text-brand">{contact}</span> · Assigned events only
      {:else}
        Staff · Assigned events only
      {/if}
    </p>
    <button
      type="button"
      class="cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-brand underline"
      on:click={() => (showLogoutConfirm = true)}
    >
      Sign Out
    </button>
  </div>

  <div
    class="hidden md:flex items-center justify-between gap-4 rounded-xl border border-paper-border bg-paper p-4 text-[13px] text-ink-secondary"
  >
    <p class="m-0 min-w-0">
      {#if contact}
        Staff Account: <span class="font-bold text-brand">{contact}</span> •
      {:else}
        Staff Account •
      {/if}
      Assigned events only. Keep app open to sync scanned tickets.
    </p>
    <button
      type="button"
      class="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-red-500 underline"
      on:click={() => (showLogoutConfirm = true)}
    >
      Sign Out
    </button>
  </div>
</div>

<LogoutConfirmModal bind:open={showLogoutConfirm} on:confirm={authedLogout} />

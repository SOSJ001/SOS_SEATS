<script>
  // @ts-nocheck
  /**
   * Door shell: staff / scanner top bar (530:195 / 4:851).
   * With a title (scanner, roadmap 7.2) the desktop bar is the scanner header (55:2244):
   * dark slate, event name + camera status centred, back link on the right.
   */
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import AuthedWordmark from "./AuthedWordmark.svelte";
  import LogoutConfirmModal from "./LogoutConfirmModal.svelte";
  import { authedLogout, initialsFromName } from "./authedLogout.js";
  import { doorScannerStatus } from "$lib/client/doorUi.js";

  export let userName = "User";
  export let roleLabel = "STAFF";
  export let homeHref = "/dashboard/staff";
  /** Full-bleed content (scanner); no page padding. */
  export let flush = false;
  /** Scanner event name; switches the desktop bar to the scanner header. */
  export let title = "";
  export let backHref = "";
  export let backLabel = "Back";

  const STATUS = {
    idle: { label: "Camera off", dot: "bg-[#94a3b8]", text: "text-[#94a3b8]" },
    starting: { label: "Starting camera", dot: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
    active: { label: "Scanner Active", dot: "bg-accent-green", text: "text-accent-green" },
    paused: { label: "Paused", dot: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
    blocked: { label: "Camera blocked", dot: "bg-[#ef4444]", text: "text-[#f87171]" },
    insecure: { label: "Camera needs https", dot: "bg-[#ef4444]", text: "text-[#f87171]" },
  };

  let showLogoutConfirm = false;

  $: initials = initialsFromName(userName);
  $: scanner = !!title;
  $: status = STATUS[$doorScannerStatus] || STATUS.idle;
</script>

<div class="authed-shell min-h-screen flex flex-col bg-public-page text-ink">
  <header
    class="sticky top-0 z-30 flex items-center justify-between gap-4 border-b px-5 py-3.5 md:px-8 {scanner
      ? 'bg-paper border-black/[0.06] md:bg-slate-public md:border-white/[0.08] md:h-[72px] md:py-0 md:shadow-[0_6px_9px_rgba(0,0,0,0.08)]'
      : 'bg-paper border-black/[0.06] md:py-4'}"
  >
    {#if scanner}
      <span class="md:hidden"><AuthedWordmark variant="light" href={homeHref} /></span>
      <span class="hidden md:block"><AuthedWordmark variant="dark" href={homeHref} /></span>

      <div class="hidden md:flex min-w-0 flex-1 flex-col items-center gap-1">
        <p class="m-0 max-w-full truncate text-xl font-extrabold text-white">{title}</p>
        <p class="m-0 inline-flex items-center gap-2 text-[13px] font-semibold {status.text}">
          <span class="size-2.5 rounded-full {status.dot}" aria-hidden="true"></span>
          {status.label}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span
          class="md:hidden rounded-[20px] bg-brand px-3 py-1.5 text-xs font-bold text-white"
          >{roleLabel}</span
        >
        {#if backHref}
          <a
            href={backHref}
            class="hidden md:inline-flex items-center gap-2 rounded-[10px] border border-white/20 px-3 py-2 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-white/10"
          >
            <ArrowLeft class="size-4" aria-hidden="true" />
            {backLabel}
          </a>
        {/if}
        <button
          type="button"
          class="text-sm font-semibold text-ink-secondary hover:text-brand md:text-white/70 md:hover:text-white bg-transparent border-0 p-0 cursor-pointer"
          on:click={() => (showLogoutConfirm = true)}
        >
          Logout
        </button>
      </div>
    {:else}
      <AuthedWordmark variant="light" href={homeHref} />

      <div class="flex items-center gap-3 md:gap-4">
        <div class="hidden sm:flex flex-col items-end gap-0.5 mr-1">
          <span class="text-[10px] font-extrabold tracking-wide text-brand uppercase"
            >{roleLabel}</span
          >
          <span class="text-sm font-semibold text-ink truncate max-w-[140px]">{userName}</span>
        </div>
        <div
          class="size-8 rounded-2xl bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0"
          aria-hidden="true"
        >
          {initials}
        </div>
        <span class="sm:hidden text-sm font-semibold text-ink truncate max-w-[100px]">{userName}</span>
        <button
          type="button"
          class="text-sm font-semibold text-ink-secondary hover:text-brand bg-transparent border-0 p-0 cursor-pointer ml-1"
          on:click={() => (showLogoutConfirm = true)}
        >
          Logout
        </button>
      </div>
    {/if}
  </header>

  <main class="flex-1 flex flex-col">
    {#if flush}
      <div class="flex-1 flex flex-col">
        <slot />
      </div>
    {:else}
      <div class="p-4 md:p-6">
        <slot />
      </div>
    {/if}
  </main>
</div>

<LogoutConfirmModal
  bind:open={showLogoutConfirm}
  on:confirm={authedLogout}
/>

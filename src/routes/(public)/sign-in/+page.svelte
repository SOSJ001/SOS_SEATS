<script>
  // @ts-nocheck
  /**
   * Role selector (FR-39 / roadmap 2.5).
   * Mobile HI-FI 261:60; desktop uses shared AuthHeroPanel + AuthPanelShell chrome.
   */
  import { page } from "$app/stores";
  import { authSearchParams } from "$lib/auth/postAuthRedirect.js";
  import AuthWordmark from "$lib/components/auth/AuthWordmark.svelte";
  import AuthHeroPanel from "$lib/components/auth/AuthHeroPanel.svelte";
  import AuthPanelShell from "$lib/components/auth/AuthPanelShell.svelte";
  import RoleCard from "$lib/components/auth/RoleCard.svelte";

  $: next = $page.url.searchParams.get("next");
  $: attendeeHref = `/sign-in/phone${authSearchParams({ next, role: "attendee" })}`;
  $: organizerHref = `/sign-in/email${authSearchParams({ next, role: "organizer" })}`;
  $: staffHref = `/sign-in/email${authSearchParams({ next, role: "staff" })}`;
</script>

<!-- Mobile role-selector (HI-FI 261:60) -->
<div class="flex min-h-screen flex-col bg-white text-ink lg:hidden">
  <div class="flex flex-col">
    <header
      class="flex w-full flex-col items-start gap-5 bg-gradient-to-b from-[#fff7ed] to-paper-cream p-6"
    >
      <AuthWordmark size="mobile" />
      <div class="flex w-full flex-col items-start gap-2">
        <h1 class="m-0 w-full text-[28px] font-extrabold leading-none text-ink">
          Welcome to SOS SEATS
        </h1>
        <p class="m-0 w-full text-sm font-normal leading-normal text-ink-secondary">
          Choose how you want to sign in
        </p>
      </div>
    </header>

    <div class="flex w-full flex-col gap-4 px-6 pb-6">
      <RoleCard
        role="attendee"
        href={attendeeHref}
        title="Attendee"
        description="Buy tickets, claim free events, show entry QR"
      />
      <RoleCard
        role="organizer"
        href={organizerHref}
        title="Organizer"
        description="Create events, sell tickets, manage & withdraw"
      />
      <RoleCard
        role="staff"
        href={staffHref}
        title="Staff"
        description="Scan tickets at the door for assigned events"
      />

      <div class="flex w-full items-center gap-3 overflow-hidden">
        <div class="h-px min-w-0 flex-1 bg-[#e8e3de]"></div>
        <span
          class="shrink-0 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-secondary"
          >OR</span
        >
        <div class="h-px min-w-0 flex-1 bg-[#e8e3de]"></div>
      </div>

      <div class="flex w-full flex-col items-center gap-3 text-center">
        <a
          href="/marketplace"
          class="w-full text-base font-extrabold leading-none text-brand no-underline hover:underline"
        >
          Browse events without signing in
        </a>
        <p class="m-0 w-full text-xs font-normal leading-[1.4] text-ink-muted">
          By signing in, you agree to our
          <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
          and
          <a href="/privacy" class="font-semibold text-brand hover:underline"
            >Privacy Policy</a
          >
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Desktop: shared auth chrome (hero + decor via AuthPanelShell) -->
<div
  class="hidden min-h-screen bg-white text-ink lg:flex lg:h-screen lg:h-[100dvh] lg:overflow-hidden"
>
  <AuthHeroPanel />

  <AuthPanelShell>
    <div class="flex w-full flex-col items-center gap-[var(--auth-field-gap)] text-center">
      <h1 class="m-0 w-full text-[length:var(--auth-title-size)] font-extrabold text-ink">
        Welcome to SOS SEATS
      </h1>
      <p class="m-0 w-full text-sm font-normal text-ink-secondary">
        Choose how you want to sign in
      </p>
    </div>

    <div class="flex w-full flex-col gap-4">
      <RoleCard
        role="attendee"
        href={attendeeHref}
        title="Attendee"
        description="Buy tickets, claim free events, show entry QR"
      />
      <RoleCard
        role="organizer"
        href={organizerHref}
        title="Organizer"
        description="Create events, sell tickets, manage & withdraw"
      />
      <RoleCard
        role="staff"
        href={staffHref}
        title="Staff"
        description="Scan tickets at the door for assigned events"
      />
    </div>

    <div class="flex w-full flex-col items-center gap-3 text-center">
      <div class="flex w-full items-center gap-3">
        <div class="h-px min-w-0 flex-1 bg-paper-border"></div>
        <span
          class="rounded-full bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-[0.02em] text-ink-secondary"
          >or</span
        >
        <div class="h-px min-w-0 flex-1 bg-paper-border"></div>
      </div>

      <a
        href="/marketplace"
        class="w-full text-base font-extrabold leading-none text-brand no-underline hover:underline"
      >
        Browse events without signing in
      </a>

      <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
        By signing in, you agree to our
        <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
        and
        <a href="/privacy" class="font-semibold text-brand hover:underline">Privacy Policy</a>
      </p>
    </div>
  </AuthPanelShell>
</div>

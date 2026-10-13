<script>
  // @ts-nocheck
  /** Door staff sign-in (HI-FI 36:1001 mobile, 55:816 desktop; error 1540:6018 / 1540:6068). */
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { safeNext } from "$lib/auth/postAuthRedirect.js";
  import Lock from "lucide-svelte/icons/lock";
  import AuthTextField from "$lib/components/auth/AuthTextField.svelte";
  import AuthPrimaryButton from "$lib/components/auth/AuthPrimaryButton.svelte";
  import AuthHeroPanel from "$lib/components/auth/AuthHeroPanel.svelte";
  import AuthPanelShell from "$lib/components/auth/AuthPanelShell.svelte";
  import AuthMobileTopRow from "$lib/components/auth/AuthMobileTopRow.svelte";
  import AuthChangeRoleLink from "$lib/components/auth/AuthChangeRoleLink.svelte";
  import StaffAuthCallout from "$lib/components/auth/StaffAuthCallout.svelte";

  let identifier = "";
  let password = "";
  let errorMessage = null;
  let loading = false;

  $: next = $page.url.searchParams.get("next");

  async function onSubmit() {
    errorMessage = null;
    loading = true;
    try {
      const res = await fetch("/api/auth/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        errorMessage = body.error || "Sign in failed";
        loading = false;
        return;
      }
      await invalidateAll();
      goto(safeNext(next, "staff"));
    } catch {
      errorMessage = "Something went wrong. Please try again.";
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Staff Sign In | SOS SEATS</title>
</svelte:head>

<!-- Mobile (HI-FI 36:1001) -->
<div class="flex min-h-screen flex-col justify-between bg-white text-ink lg:hidden">
  <div class="flex w-full flex-col">
    <header
      class="flex w-full flex-col items-start gap-5 bg-gradient-to-b from-[#fff7ed] to-paper-cream p-6"
    >
      <AuthMobileTopRow />
      <div class="flex w-full flex-col items-start gap-2">
        <h1 class="m-0 text-[32px] font-extrabold leading-[1.1] text-ink">Staff Sign In</h1>
        <p class="m-0 text-sm leading-[1.5] text-ink-secondary">
          Scan assigned events only. Your access is restricted to your organizer's configured events.
        </p>
      </div>
    </header>

    <form class="flex w-full flex-col gap-6 px-6 pb-10" on:submit|preventDefault={onSubmit}>
      <div
        class="flex w-full flex-col gap-5 rounded-2xl border border-paper-border bg-white p-6 shadow-[0px_8px_12px_rgba(18,4,28,0.05)]"
      >
        <AuthTextField
          id="staff-sign-in-identifier-mobile"
          label="Email or Phone Number"
          type="text"
          bind:value={identifier}
          placeholder="e.g. staff@freetown.com"
          autocomplete="username"
          variant="mobile"
        />
        <AuthTextField
          id="staff-sign-in-password-mobile"
          label="Password"
          bind:value={password}
          placeholder="••••••••"
          autocomplete="current-password"
          showPasswordToggle={true}
          variant="mobile"
        />
      </div>

      {#if errorMessage}
        <StaffAuthCallout tone="error">{errorMessage}</StaffAuthCallout>
      {/if}

      <AuthPrimaryButton size="mobile" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </AuthPrimaryButton>

      <StaffAuthCallout tone="help">
        Your organizer set your login. Contact them if you need help.
      </StaffAuthCallout>

      <AuthChangeRoleLink />
    </form>
  </div>

  <footer class="flex w-full flex-col items-center gap-3 px-6 pb-8">
    <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
      By signing in, you agree to our
      <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
      and
      <a href="/privacy" class="font-semibold text-brand hover:underline">Privacy Policy</a>
    </p>
    <div
      class="flex w-full items-center gap-2.5 rounded-xl border border-paper-border bg-paper-cream px-4 py-3"
    >
      <span
        class="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#e5ded4] bg-[#f2ebe0] text-ink-secondary"
        aria-hidden="true"
      >
        <Lock size={18} />
      </span>
      <p class="m-0 text-[13px] text-ink-secondary">Secure staff access</p>
    </div>
  </footer>
</div>

<!-- Desktop (HI-FI 55:816) -->
<div class="hidden min-h-screen bg-white text-ink lg:flex lg:h-screen lg:h-[100dvh] lg:overflow-hidden">
  <AuthHeroPanel
    tagline="Scan tickets faster. Manage your assigned events from one place."
    trustLeft="Real-time scanning sync"
    trustRight="Assigned events only"
  />

  <AuthPanelShell bordered>
    <div class="flex w-full flex-col items-center gap-2 text-center">
      <div class="flex items-center gap-2">
        <h1 class="m-0 text-[length:var(--auth-title-size)] font-extrabold text-ink">
          Staff Sign In
        </h1>
        <span
          class="rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-700"
          >PORTAL</span
        >
      </div>
      <p class="m-0 w-full text-sm font-normal text-ink-secondary">Scan assigned events only</p>
    </div>

    <form class="flex w-full flex-col gap-[var(--auth-form-gap)]" on:submit|preventDefault={onSubmit}>
      <AuthTextField
        id="staff-sign-in-identifier"
        label="Staff Email or Phone"
        type="text"
        bind:value={identifier}
        placeholder="e.g. staff@freetown.com"
        autocomplete="username"
        showLeadingIcon={true}
        leadingIcon="mail"
      />
      <StaffAuthCallout tone="help">
        Your parent organizer account configured your login credentials. If you forgot your
        password contact them.
      </StaffAuthCallout>
      <AuthTextField
        id="staff-sign-in-password"
        label="Access Password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        showLeadingIcon={true}
        leadingIcon="lock"
        showPasswordToggle={true}
      />
      {#if errorMessage}
        <StaffAuthCallout tone="error">{errorMessage}</StaffAuthCallout>
      {/if}
      <AuthPrimaryButton disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </AuthPrimaryButton>
    </form>

    <div class="flex w-full flex-col items-center gap-3 text-center">
      <p class="m-0 w-full text-sm text-ink-secondary">Contact your organizer if you need access</p>
      <AuthChangeRoleLink />
      <p class="m-0 w-full text-[13px] leading-[1.5] text-ink-secondary">
        By signing in, you agree to our
        <a href="/terms" class="font-bold text-brand hover:underline">Terms</a>
        and
        <a href="/privacy" class="font-bold text-brand hover:underline">Privacy Policy</a>
      </p>
    </div>
  </AuthPanelShell>
</div>

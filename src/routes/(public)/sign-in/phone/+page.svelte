<script>
  // @ts-nocheck
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { authSearchParams, safeNext } from "$lib/auth/postAuthRedirect.js";
  import AuthTextField from "$lib/components/auth/AuthTextField.svelte";
  import AuthPhoneField from "$lib/components/auth/AuthPhoneField.svelte";
  import AuthPrimaryButton from "$lib/components/auth/AuthPrimaryButton.svelte";
  import AuthHeroPanel from "$lib/components/auth/AuthHeroPanel.svelte";
  import AuthPanelShell from "$lib/components/auth/AuthPanelShell.svelte";
  import AuthWordmark from "$lib/components/auth/AuthWordmark.svelte";

  let phone = "";
  let password = "";
  let errorMessage = null;
  let loading = false;

  $: role = $page.url.searchParams.get("role");
  $: next = $page.url.searchParams.get("next");
  $: authQuery = authSearchParams({ next, role });
  $: isStaff = role === "staff";

  async function onSubmit() {
    errorMessage = null;
    loading = true;
    try {
      const res = await fetch("/api/auth/phone/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        errorMessage = body.error || "Sign in failed";
        loading = false;
        return;
      }
      await invalidateAll();
      goto(safeNext(next, role));
    } catch {
      errorMessage = "Something went wrong. Please try again.";
      loading = false;
    }
  }
</script>

<!-- Mobile phone sign-in (HI-FI 4:369) -->
<div class="flex min-h-screen flex-col bg-paper-cream text-ink lg:hidden">
  <header
    class="flex w-full flex-col items-start gap-5 bg-gradient-to-b from-brand-soft to-paper-cream p-6"
  >
    <AuthWordmark size="mobile" />
    <div class="flex w-full flex-col items-start gap-2">
      <h1 class="m-0 text-[28px] font-extrabold leading-none text-ink">
        Sign In with Phone
      </h1>
      <p class="m-0 text-sm leading-[1.4] text-ink-secondary opacity-85">
        Phone and password. Quick and secure access.
      </p>
    </div>
  </header>

  <form
    class="flex w-full flex-col gap-6 px-6 pb-10"
    on:submit|preventDefault={onSubmit}
  >
    <div
      class="flex w-full flex-col gap-4 rounded-2xl border border-paper-border bg-white p-4 shadow-[0px_2px_4px_rgba(18,4,28,0.03),0px_10px_14px_rgba(18,4,28,0.05)]"
    >
      <AuthPhoneField
        id="phone-sign-in-phone-mobile"
        bind:value={phone}
        variant="mobile"
      />
      <AuthTextField
        id="phone-sign-in-password-mobile"
        label="Identity Password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        showPasswordToggle={true}
        variant="mobile"
      />
      {#if errorMessage}
        <p class="m-0 text-sm text-red-600" role="alert">{errorMessage}</p>
      {/if}
    </div>

    <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
      By signing in, you agree to our
      <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
      and
      <a href="/privacy" class="font-semibold text-brand hover:underline"
        >Privacy Policy</a
      >
    </p>

    <div class="flex w-full flex-col items-start gap-4">
      <AuthPrimaryButton size="mobile" disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </AuthPrimaryButton>

      <div class="flex w-full flex-col items-center gap-3">
        <div class="flex w-full items-center gap-3">
          <div class="h-px min-w-0 flex-1 bg-paper-border"></div>
          <span
            class="rounded-full border border-paper-border bg-paper-cream px-2.5 py-1 text-xs font-bold uppercase text-ink-secondary"
            >OR</span
          >
          <div class="h-px min-w-0 flex-1 bg-paper-border"></div>
        </div>

        <a
          href="/sign-in/email{authQuery}"
          class="flex h-11 w-full items-center justify-center rounded-[10px] border border-brand bg-white text-sm font-bold text-brand hover:bg-brand-soft"
        >
          Sign in with Email
        </a>
      </div>

      {#if !isStaff}
        <p class="m-0 w-full text-center text-sm text-ink-secondary">
          New to SOS SEATS?
          <a
            href="/sign-up/phone{authQuery}"
            class="font-extrabold text-brand hover:underline">Create Phone Account</a
          >
        </p>
      {/if}
    </div>
  </form>
</div>

<!-- Desktop phone sign-in (HI-FI 55:798) -->
<div
  class="hidden min-h-screen bg-white text-ink lg:flex lg:h-screen lg:h-[100dvh] lg:overflow-hidden"
>
  <AuthHeroPanel />

  <AuthPanelShell>
    <div
      class="flex w-full flex-col items-center gap-[var(--auth-field-gap)] text-center"
    >
      <h1
        class="m-0 w-full text-[length:var(--auth-title-size)] font-extrabold text-ink"
      >
        Phone Sign In
      </h1>
      <p class="m-0 w-full text-sm font-normal text-ink-secondary">
        Sign in with your Sierra Leone phone number and password
      </p>
    </div>

    <form
      class="flex w-full flex-col gap-[var(--auth-form-gap)]"
      on:submit|preventDefault={onSubmit}
    >
      <AuthPhoneField
        id="phone-sign-in-phone"
        bind:value={phone}
        placeholder="76 123456"
        showLeadingIcon={true}
      />
      <AuthTextField
        id="phone-sign-in-password"
        label="Password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        showLeadingIcon={true}
        leadingIcon="lock"
        showPasswordToggle={true}
      />

      {#if errorMessage}
        <p class="m-0 text-sm text-red-600" role="alert">{errorMessage}</p>
      {/if}

      <AuthPrimaryButton disabled={loading}>
        {loading ? "Signing in…" : "Sign In"}
      </AuthPrimaryButton>
    </form>

    <div class="flex w-full flex-col items-center gap-3 text-center">
      <div class="flex w-full flex-col items-center gap-3">
        <div class="flex w-full items-center gap-3">
          <div class="h-px min-w-0 flex-1 bg-paper-border"></div>
          <span
            class="rounded-full bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-[0.02em] text-ink-secondary"
            >or</span
          >
          <div class="h-px min-w-0 flex-1 bg-paper-border"></div>
        </div>

        <a
          href="/sign-in/email{authQuery}"
          class="flex h-10 w-full items-center justify-center rounded-[10px] border border-brand bg-white text-sm font-bold text-brand hover:bg-brand-soft"
        >
          Sign in with Email
        </a>
      </div>

      {#if !isStaff}
        <p class="m-0 w-full text-center text-sm text-ink-secondary">
          New to SOS SEATS?
          <a
            href="/sign-up/phone{authQuery}"
            class="font-bold text-brand hover:underline">Create Phone Account</a
          >
        </p>
      {/if}

      <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
        By signing in, you agree to our
        <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
        and
        <a href="/privacy" class="font-semibold text-brand hover:underline"
          >Privacy Policy</a
        >
      </p>
    </div>
  </AuthPanelShell>
</div>

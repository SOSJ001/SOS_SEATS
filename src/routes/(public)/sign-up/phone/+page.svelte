<script>
  // @ts-nocheck
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import AuthTextField from "$lib/components/auth/AuthTextField.svelte";
  import AuthPhoneField from "$lib/components/auth/AuthPhoneField.svelte";
  import AuthPrimaryButton from "$lib/components/auth/AuthPrimaryButton.svelte";
  import AuthHeroPanel from "$lib/components/auth/AuthHeroPanel.svelte";
  import AuthPanelShell from "$lib/components/auth/AuthPanelShell.svelte";
  import AuthWordmark from "$lib/components/auth/AuthWordmark.svelte";
  import { authSearchParams, safeNext } from "$lib/auth/postAuthRedirect.js";

  let name = "";
  let phone = "";
  let password = "";
  let errorMessage = null;
  let loading = false;

  $: role = $page.url.searchParams.get("role");
  $: next = $page.url.searchParams.get("next");
  $: authQuery = authSearchParams({ next, role });

  async function onSubmit() {
    errorMessage = null;
    loading = true;
    try {
      const res = await fetch("/api/auth/phone/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        errorMessage = body.error || "Could not create account";
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

<!-- Mobile phone sign-up (HI-FI 1049:1974) -->
<div class="flex min-h-screen flex-col bg-paper-cream text-ink lg:hidden">
  <header
    class="flex w-full flex-col items-start gap-5 bg-gradient-to-b from-brand-soft to-paper-cream p-6"
  >
    <AuthWordmark size="mobile" />
    <div class="flex w-full flex-col items-start gap-2">
      <h1 class="m-0 text-[28px] font-extrabold leading-none text-ink">
        Create Phone Account
      </h1>
      <p class="m-0 text-sm leading-[1.4] text-ink-secondary opacity-85">
        Phone and password for paid mobile money tickets.
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
      <AuthTextField
        id="phone-sign-up-name-mobile"
        label="Full Name"
        bind:value={name}
        placeholder="e.g. Musa Kamara"
        autocomplete="name"
        variant="mobile"
      />
      <AuthPhoneField
        id="phone-sign-up-phone-mobile"
        bind:value={phone}
        variant="mobile"
      />
      <AuthTextField
        id="phone-sign-up-password-mobile"
        label="Identity Password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="new-password"
        showPasswordToggle={true}
        variant="mobile"
      />
      {#if errorMessage}
        <p class="m-0 text-sm text-red-600" role="alert">{errorMessage}</p>
      {/if}
    </div>

    <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
      By creating an account, you agree to our
      <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
      and
      <a href="/privacy" class="font-semibold text-brand hover:underline"
        >Privacy Policy</a
      >
    </p>

    <div class="flex w-full flex-col items-start gap-4">
      <AuthPrimaryButton size="mobile" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </AuthPrimaryButton>

      <p class="m-0 w-full text-center text-sm text-ink-muted">
        Already have a phone account?
        <a
          href="/sign-in{authQuery}"
          class="font-extrabold text-brand hover:underline">Sign In</a
        >
      </p>
    </div>
  </form>
</div>

<!-- Desktop phone sign-up (HI-FI 1050:1974) -->
<div
  class="hidden min-h-screen bg-white text-ink lg:flex lg:h-screen lg:h-[100dvh] lg:overflow-hidden"
>
  <AuthHeroPanel />

  <AuthPanelShell bordered>
    <div
      class="flex w-full flex-col items-center gap-[var(--auth-field-gap)] text-center"
    >
      <h1
        class="m-0 w-full text-[length:var(--auth-title-size)] font-extrabold text-ink"
      >
        Create Phone Account
      </h1>
      <p class="m-0 w-full text-sm font-normal text-ink-secondary">
        Phone and password for paid mobile money tickets.
      </p>
    </div>

    <form
      class="flex w-full flex-col gap-[var(--auth-form-gap)]"
      on:submit|preventDefault={onSubmit}
    >
      <AuthTextField
        id="phone-sign-up-name"
        label="Full Name"
        bind:value={name}
        placeholder="e.g. Musa Kamara"
        autocomplete="name"
      />
      <AuthPhoneField
        id="phone-sign-up-phone"
        bind:value={phone}
        placeholder="76 123456"
        showLeadingIcon={true}
      />
      <AuthTextField
        id="phone-sign-up-password"
        label="Identity Password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="new-password"
        showLeadingIcon={true}
        leadingIcon="lock"
        showPasswordToggle={true}
      />

      {#if errorMessage}
        <p class="m-0 text-sm text-red-600" role="alert">{errorMessage}</p>
      {/if}

      <AuthPrimaryButton disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </AuthPrimaryButton>
    </form>

    <div class="flex w-full flex-col items-center gap-3 text-center">
      <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
        By creating an account, you agree to our
        <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
        and
        <a href="/privacy" class="font-semibold text-brand hover:underline"
          >Privacy Policy</a
        >
      </p>

      <p class="m-0 w-full text-center text-sm text-ink-muted">
        Already have a phone account?
        <a
          href="/sign-in{authQuery}"
          class="font-bold text-brand hover:underline">Sign In</a
        >
      </p>
    </div>
  </AuthPanelShell>
</div>

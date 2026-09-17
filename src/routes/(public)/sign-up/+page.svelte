<script>
  // @ts-nocheck
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import AuthTextField from "$lib/components/auth/AuthTextField.svelte";
  import AuthPrimaryButton from "$lib/components/auth/AuthPrimaryButton.svelte";
  import AuthHeroPanel from "$lib/components/auth/AuthHeroPanel.svelte";
  import AuthPanelShell from "$lib/components/auth/AuthPanelShell.svelte";
  import AuthWordmark from "$lib/components/auth/AuthWordmark.svelte";

  let name = "";
  let userName = "";
  let email = "";
  let password = "";
  let errorMessage = null;
  let loading = false;

  function safeNext(raw) {
    if (!raw || typeof raw !== "string") return "/dashboard";
    const path = raw.trim();
    if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
    return path;
  }

  async function onSubmit() {
    errorMessage = null;
    loading = true;
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, userName }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        errorMessage = body.error || "Could not create account";
        loading = false;
        return;
      }
      await invalidateAll();
      goto(safeNext($page.url.searchParams.get("next")));
    } catch {
      errorMessage = "Something went wrong. Please try again.";
      loading = false;
    }
  }
</script>

<!-- Mobile Sign Up (HI-FI 947:1932) -->
<div class="flex min-h-screen flex-col bg-paper-cream text-ink lg:hidden">
  <header
    class="flex w-full flex-col items-start gap-5 bg-gradient-to-b from-brand-soft to-paper-cream p-6"
  >
    <AuthWordmark size="mobile" />
    <div class="flex w-full flex-col items-start gap-2">
      <h1 class="m-0 text-[28px] font-extrabold leading-none text-ink">Sign Up</h1>
      <p class="m-0 text-sm leading-[1.4] text-ink-secondary opacity-85">
        Create an account with email and password to buy tickets and manage events.
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
        id="sign-up-name-mobile"
        label="Full name"
        bind:value={name}
        placeholder="e.g. Musa Kamara"
        autocomplete="name"
        variant="mobile"
      />
      <AuthTextField
        id="sign-up-username-mobile"
        label="Username"
        bind:value={userName}
        placeholder="e.g. musa_k"
        autocomplete="username"
        variant="mobile"
      />
      <AuthTextField
        id="sign-up-email-mobile"
        label="Email Address"
        type="email"
        bind:value={email}
        placeholder="name@domain.com"
        autocomplete="email"
        variant="mobile"
      />
      <AuthTextField
        id="sign-up-password-mobile"
        label="Password"
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

    <div class="flex w-full flex-col items-start gap-4">
      <AuthPrimaryButton size="mobile" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </AuthPrimaryButton>

      <p class="m-0 w-full text-center text-sm text-ink-secondary">
        Already have an account?
        <a href="/sign-in" class="font-extrabold text-brand hover:underline">Sign In</a>
      </p>
    </div>

    <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
      By creating an account, you agree to our
      <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
      and
      <a href="/privacy" class="font-semibold text-brand hover:underline">Privacy Policy</a>
    </p>
  </form>
</div>

<!-- Desktop AuthPanel -->
<div class="hidden min-h-screen bg-white text-ink lg:flex lg:h-screen lg:h-[100dvh] lg:overflow-hidden">
  <AuthHeroPanel />

  <AuthPanelShell bordered>
    <div class="flex w-full flex-col items-center gap-[var(--auth-field-gap)] text-center">
      <h1 class="m-0 w-full text-[length:var(--auth-title-size)] font-extrabold text-ink">Create your account</h1>
      <p class="m-0 w-full text-sm font-normal text-ink-secondary">
        Create an account with email and password to buy tickets and manage events.
      </p>
    </div>

    <form class="flex w-full flex-col gap-[var(--auth-form-gap)]" on:submit|preventDefault={onSubmit}>
      <AuthTextField
        id="sign-up-name"
        label="Full name"
        bind:value={name}
        placeholder="e.g. Musa Kamara"
        autocomplete="name"
      />
      <AuthTextField
        id="sign-up-username"
        label="Username"
        bind:value={userName}
        placeholder="e.g. musa_k"
        autocomplete="username"
      />
      <AuthTextField
        id="sign-up-email"
        label="Email Address"
        type="email"
        bind:value={email}
        placeholder="e.g. musa@kamara.com"
        autocomplete="email"
        showLeadingIcon={true}
        leadingIcon="mail"
      />
      <AuthTextField
        id="sign-up-password"
        label="Password"
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
      <p class="m-0 w-full text-sm text-ink-secondary">
        Already have an account?
        <a href="/sign-in" class="font-bold text-brand hover:underline">Sign In</a>
      </p>
      <p class="m-0 w-full text-center text-xs leading-[1.5] text-ink-muted">
        By creating an account, you agree to our
        <a href="/terms" class="font-semibold text-brand hover:underline">Terms</a>
        and
        <a href="/privacy" class="font-semibold text-brand hover:underline">Privacy Policy</a>
      </p>
    </div>
  </AuthPanelShell>
</div>

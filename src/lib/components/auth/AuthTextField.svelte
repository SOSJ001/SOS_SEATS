<script>
  // @ts-nocheck
  import Mail from "lucide-svelte/icons/mail";
  import Lock from "lucide-svelte/icons/lock";
  import Eye from "lucide-svelte/icons/eye";
  import EyeOff from "lucide-svelte/icons/eye-off";

  export let id;
  export let label;
  export let type = "text";
  export let value = "";
  export let placeholder = "";
  export let autocomplete = "off";
  export let required = true;
  export let showLeadingIcon = false;
  export let leadingIcon = "mail";
  export let showPasswordToggle = false;
  /** `"default"` | `"mobile"` — mobile matches Figma 4:325 (52px / SHOW text). */
  export let variant = "default";

  let showPassword = false;

  $: isMobile = variant === "mobile";
  $: useLeadingIcon = showLeadingIcon && !isMobile;

  function onInput(e) {
    value = e.currentTarget.value;
  }
</script>

<div class="flex w-full flex-col {isMobile ? 'gap-2' : 'gap-[var(--auth-field-gap)]'}">
  <label
    for={id}
    class={isMobile
      ? "text-[11px] font-bold uppercase text-ink-secondary"
      : "text-sm font-semibold text-ink"}>{label}</label
  >
  <div
    class="flex items-center border border-paper-border bg-white {isMobile
      ? 'h-[52px] gap-3 rounded-xl px-4'
      : 'h-[var(--auth-input-h)] gap-2 rounded-[var(--auth-input-radius)] px-3.5'}"
  >
    {#if useLeadingIcon && leadingIcon === "mail"}
      <Mail
        class="shrink-0 text-ink-muted"
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    {:else if useLeadingIcon && leadingIcon === "lock"}
      <Lock
        class="shrink-0 text-ink-muted"
        size={16}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    {/if}
    {#if showPasswordToggle}
      <input
        {id}
        {required}
        {autocomplete}
        {placeholder}
        type={showPassword ? "text" : "password"}
        {value}
        on:input={onInput}
        class="min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0 {isMobile
          ? 'text-[15px] text-ink placeholder:text-ink-secondary'
          : 'text-sm text-ink placeholder:text-[#999]'}"
      />
    {:else}
      <input
        {id}
        {required}
        {autocomplete}
        {placeholder}
        {type}
        {value}
        on:input={onInput}
        class="min-w-0 flex-1 border-0 bg-transparent p-0 focus:outline-none focus:ring-0 {isMobile
          ? 'text-[15px] text-ink placeholder:text-ink-secondary'
          : 'text-sm text-ink placeholder:text-[#999]'}"
      />
    {/if}
    {#if showPasswordToggle}
      {#if isMobile}
        <button
          type="button"
          class="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-extrabold uppercase text-brand"
          aria-label={showPassword ? "Hide password" : "Show password"}
          on:click={() => (showPassword = !showPassword)}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      {:else}
        <button
          type="button"
          class="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-ink-muted"
          aria-label={showPassword ? "Hide password" : "Show password"}
          on:click={() => (showPassword = !showPassword)}
        >
          {#if showPassword}
            <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" />
          {:else}
            <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
          {/if}
        </button>
      {/if}
    {/if}
  </div>
</div>

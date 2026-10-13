<script>
  // @ts-nocheck
  /**
   * Invite Staff text field (HI-FI 59:23 desktop, 36:758 mobile, error 1540:4037).
   * Password type gets a show/hide toggle.
   */
  import Eye from "lucide-svelte/icons/eye";
  import EyeOff from "lucide-svelte/icons/eye-off";

  export let id;
  export let label;
  /** Mobile label when it differs from the desktop one. */
  export let mobileLabel = "";
  export let value = "";
  /** `"text"` | `"password"` */
  export let type = "text";
  export let placeholder = "";
  export let autocomplete = "off";
  export let inputmode = undefined;
  export let error = "";
  /** `"form"` (Invite card) | `"panel"` (Edit dialog 1540:5732: desktop look at every size) */
  export let variant = "form";

  let showPassword = false;

  $: panel = variant === "panel";

  $: isPassword = type === "password";
  $: inputType = isPassword && !showPassword ? "password" : "text";

  function onInput(e) {
    value = e.currentTarget.value;
  }
</script>

<div class="flex w-full flex-col {panel ? 'gap-2' : 'gap-1.5 lg:gap-2'}">
  <label
    for={id}
    class="font-bold {panel
      ? 'text-sm text-ink'
      : 'text-xs uppercase text-ink-secondary lg:text-sm lg:normal-case lg:text-ink'}"
  >
    {#if mobileLabel}
      <span class="lg:hidden">{mobileLabel}</span>
      <span class="hidden lg:inline">{label}</span>
    {:else}
      {label}
    {/if}
  </label>

  <div
    class="flex w-full items-center gap-2 rounded-lg bg-white px-4 {panel
      ? 'h-12 border-[1.5px] shadow-[inset_0px_1px_2px_rgba(0,0,0,0.04)]'
      : 'h-11 border lg:h-10 lg:border-[1.5px] lg:shadow-[inset_0px_1px_2px_rgba(0,0,0,0.04)]'} {error
      ? 'border-[1.5px] border-red-500 lg:border-red-500'
      : panel
        ? 'border-[#c7bfb8] focus-within:border-brand'
        : 'border-paper-border focus-within:border-brand lg:border-[#c7bfb8]'}"
  >
    <input
      {id}
      {placeholder}
      {autocomplete}
      {inputmode}
      type={inputType}
      {value}
      on:input={onInput}
      on:input
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0 lg:placeholder:text-[#999]"
    />
    {#if isPassword}
      <button
        type="button"
        class="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-ink-muted hover:text-ink"
        aria-label={showPassword ? "Hide password" : "Show password"}
        on:click={() => (showPassword = !showPassword)}
      >
        {#if showPassword}
          <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
        {:else}
          <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
        {/if}
      </button>
    {/if}
  </div>

  {#if error}
    <p id="{id}-error" class="m-0 text-xs leading-normal text-red-500 lg:leading-[1.5]">{error}</p>
  {/if}
</div>

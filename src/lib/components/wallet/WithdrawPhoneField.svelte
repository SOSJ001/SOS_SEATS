<script lang="ts">
  /** Mobile shows a "+232" box before the digits; desktop takes the full number. */
  export let phone = "";
  export let error = "";
  export let disabled = false;

  $: inputClass = `h-12 w-full min-w-0 rounded-lg border bg-paper px-4 text-[15px] text-slate-public placeholder:text-[#999] focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 lg:h-10 lg:text-sm lg:text-ink ${
    error
      ? "border-[#ef4444] focus:ring-[#ef4444]"
      : "border-paper-border focus:border-brand focus:ring-brand lg:border-[#d9d9d9]"
  }`;
</script>

<div class="flex flex-col gap-2">
  <label
    for="withdraw-phone-mobile"
    class="text-[13px] font-bold leading-normal text-slate-public lg:hidden"
  >
    Phone Number
  </label>
  <label
    for="withdraw-phone-desktop"
    class="hidden text-sm font-semibold leading-normal text-ink lg:block"
  >
    Recipient's Mobile Wallet Number
  </label>

  <div class="flex gap-2 lg:hidden">
    <span
      class="flex h-12 shrink-0 items-center rounded-lg border border-paper-border bg-paper px-3 text-[15px] text-slate-public"
    >
      +232
    </span>
    <input
      id="withdraw-phone-mobile"
      type="tel"
      inputmode="tel"
      autocomplete="tel-national"
      placeholder="7X XX XX XX"
      bind:value={phone}
      {disabled}
      aria-invalid={!!error}
      class={inputClass}
    />
  </div>
  <input
    id="withdraw-phone-desktop"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    placeholder="+232 7X XX XX XX"
    bind:value={phone}
    {disabled}
    aria-invalid={!!error}
    class="hidden lg:block {inputClass}"
  />

  {#if error}
    <p class="m-0 text-xs font-semibold leading-normal text-[#ef4444]" role="alert">{error}</p>
  {/if}
</div>

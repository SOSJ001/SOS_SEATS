<script>
  // @ts-nocheck
  export let id;
  export let label;
  export let type = "text";
  export let value = "";
  export let placeholder = "";
  export let required = false;
  export let error = "";
  export let disabled = false;
  export let min = undefined;
  export let max = undefined;
  export let step = undefined;
  export let rows = undefined;

  function onInput(e) {
    value = e.currentTarget.value;
  }
</script>

<div class="flex w-full flex-col gap-1.5">
  <label for={id} class="text-[13px] font-bold text-ink">
    {label}{#if required}<span class="text-brand"> *</span>{/if}
  </label>
  {#if type === "textarea"}
    <textarea
      {id}
      {required}
      {placeholder}
      {disabled}
      {rows}
      {value}
      on:input={onInput}
      class="w-full rounded-lg border bg-white px-3.5 py-3 text-base text-ink placeholder:text-[#999] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50
        {error ? 'border-red-500' : 'border-paper-border'}"
    ></textarea>
  {:else if type === "select"}
    <select
      {id}
      {required}
      {disabled}
      {value}
      on:change={onInput}
      class="h-[42px] w-full rounded-lg border bg-white px-3.5 text-base text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50
        {error ? 'border-red-500' : 'border-paper-border'}"
    >
      <slot />
    </select>
  {:else}
    <input
      {id}
      {type}
      {required}
      {placeholder}
      {disabled}
      {min}
      {max}
      {step}
      {value}
      on:input={onInput}
      class="h-[42px] w-full rounded-lg border bg-white px-3.5 text-base text-ink placeholder:text-[#999] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50
        {error ? 'border-red-500' : 'border-paper-border'}"
    />
  {/if}
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>

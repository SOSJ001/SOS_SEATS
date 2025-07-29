<script>
  export let text = "Button";
  export let onClick = () => {};
  export let icon = "";
  export let disabled = false;
  export let class_ = "";

  // Icon mapping
  const iconMap = {
    wallet: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>`,
    default: "",
  };

  $: iconPath = iconMap[icon] || iconMap.default;
</script>

<button
  on:click={onClick}
  {disabled}
  class="relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 group/btn {class_}"
>
  <!-- Button shine effect -->
  <div
    class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"
  ></div>

  <span class="relative z-10 flex items-center justify-center gap-2">
    {#if icon && iconPath}
      <svg
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {@html iconPath}
      </svg>
    {/if}
    {text}
  </span>
</button>

<style>
  /* Button pulse effect */
  button:not(:disabled):hover {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
  }
</style>

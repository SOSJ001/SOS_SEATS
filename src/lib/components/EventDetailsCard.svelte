<script>
  export let title = "Section Title";
  export let description = "";
</script>

<div class="bg-gray-800 rounded-xl p-6 shadow-lg">
  <h2 class="text-2xl font-bold text-white mb-4">{title}</h2>
  
  {#if description}
    <p class="text-gray-300 leading-relaxed">{description}</p>
  {:else}
    <slot />
  {/if}
</div> 
<script>
  // @ts-nocheck
  /** @type {"orange_money" | "afrimoney"} */
  export let provider = "orange_money";
  let className = "h-6";
  export { className as class };

  $: src = provider === "afrimoney" ? "/afriMoney.png" : "/orangeMoney.png";
  $: alt = provider === "afrimoney" ? "Afrimoney" : "Orange Money";
</script>

<img {src} {alt} class="w-auto object-contain {className}" />

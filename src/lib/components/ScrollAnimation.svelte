<script>
  import { onMount } from "svelte";

  export let delay = 0;
  export let duration = 1000;
  export let threshold = 0.1;
  export let rootMargin = "0px 0px -50px 0px";

  /** @type {HTMLElement} */
  let element;
  let isVisible = false;

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible = true;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  });
</script>

<div
  bind:this={element}
  class="transition-all duration-{duration} delay-{delay}"
  class:opacity-0={!isVisible}
  class:opacity-100={isVisible}
  class:translate-y-8={!isVisible}
  class:translate-y-0={isVisible}
>
  <slot />
</div>

<style>
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>

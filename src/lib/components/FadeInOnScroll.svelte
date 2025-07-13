<script>
  import { onMount } from 'svelte';
  
  export let delay = 0;
  export let duration = 800;
  export let threshold = 0.1;
  export let rootMargin = '0px 0px -50px 0px';
  export let animation = 'fade-up'; // fade-up, fade-left, fade-right, scale
  
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
        rootMargin
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
  
  $: animationClasses = {
    'fade-up': {
      initial: 'opacity-0 translate-y-8',
      final: 'opacity-100 translate-y-0'
    },
    'fade-left': {
      initial: 'opacity-0 -translate-x-8',
      final: 'opacity-100 translate-x-0'
    },
    'fade-right': {
      initial: 'opacity-0 translate-x-8',
      final: 'opacity-100 translate-x-0'
    },
    'scale': {
      initial: 'opacity-0 scale-95',
      final: 'opacity-100 scale-100'
    }
  };
</script>

<div 
  bind:this={element}
  class="transition-all duration-{duration} ease-out delay-{delay}"
  class:opacity-0={!isVisible}
  class:opacity-100={isVisible}
  class:translate-y-8={!isVisible && animation === 'fade-up'}
  class:translate-y-0={isVisible && animation === 'fade-up'}
  class:-translate-x-8={!isVisible && animation === 'fade-left'}
  class:translate-x-8={!isVisible && animation === 'fade-right'}
  class:translate-x-0={isVisible && (animation === 'fade-left' || animation === 'fade-right')}
  class:scale-95={!isVisible && animation === 'scale'}
  class:scale-100={isVisible && animation === 'scale'}
>
  <slot />
</div>

<style>
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
</style> 
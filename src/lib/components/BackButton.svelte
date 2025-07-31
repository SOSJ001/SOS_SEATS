<script lang="ts">
  export let top: string = "top-20";
  export let left: string = "left-6";
  export let link: string = "/marketplace";
  export let title: string = "Back";
</script>

<div class="fixed {top} {left} z-50">
  <a
    href={link}
    class="flex items-center justify-center w-12 h-12 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-full text-white hover:bg-gray-700/90 transition-all duration-300 group"
    {title}
  >
    <svg
      class="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 19l-7-7 7-7"
      ></path>
    </svg>
  </a>
</div>

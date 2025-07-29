<script lang="ts">
  export let ticket: {
    id: number;
    name: string;
    price: number;
    description: string;
    features: string[];
  } = {
    id: 1,
    name: "Ticket Name",
    price: 0,
    description: "",
    features: []
  };
</script>

<div class="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
  <slot />
</div> 
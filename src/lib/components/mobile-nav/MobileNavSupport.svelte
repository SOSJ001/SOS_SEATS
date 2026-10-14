<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  import MobileNavItem from "./MobileNavItem.svelte";

  /** Organiser only: Settings above Terms. */
  export let showSettings = false;

  const dispatch = createEventDispatcher();

  $: items = [
    ...(showSettings ? [{ href: "/dashboard/settings", icon: "settings", label: "Settings" }] : []),
    { href: "/terms", icon: "file-text", label: "Terms" },
    { href: "/privacy", icon: "shield-check", label: "Privacy Policy" },
    { href: "/terms#contact", icon: "circle-help", label: "Help & Support" },
  ];
</script>

<div class="flex flex-col gap-1.5">
  <p class="m-0 text-xs font-bold uppercase text-ink-secondary">Support</p>
  {#each items as item (item.href)}
    <MobileNavItem {...item} on:click={() => dispatch("navigate")} />
  {/each}
</div>

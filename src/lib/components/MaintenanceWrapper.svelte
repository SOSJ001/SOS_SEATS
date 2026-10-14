<script lang="ts">
  import { Wrench } from "lucide-svelte";

  export let isUnderMaintenance: boolean = false;
  export let message: string = "This section is currently under maintenance";
  export let showIcon: boolean = true;
  export let variant: "default" | "minimal" | "full" = "default";
  export let disableContent: boolean = false; // If true, shows content but disabled. If false, hides content completely.
  export let compact: boolean = false; // If true, shows a compact overlay (better for buttons). Only works with disableContent=true.

  $: cardClass = `rounded-2xl border border-solid border-paper-border ${variant === "full" ? "p-5" : "p-4"}`;
</script>

{#if isUnderMaintenance && !disableContent}
  <!-- Hide content completely, show maintenance message -->
  <div class="relative w-full bg-paper {cardClass}">
    <div class="flex flex-col items-center justify-center gap-3 text-center">
      {#if showIcon}
        <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Wrench class="size-6" aria-hidden="true" />
        </div>
      {/if}

      <div class="flex flex-col gap-1">
        <h3 class="m-0 font-bold text-ink {variant === 'minimal' ? 'text-base' : 'text-lg'}">
          {variant === "minimal" ? "Maintenance" : "Under Maintenance"}
        </h3>
        <p class="m-0 mx-auto max-w-md text-ink-secondary {variant === 'minimal' ? 'text-xs' : 'text-sm'}">
          {message}
        </p>
        {#if variant === "full"}
          <p class="m-0 mt-1 text-xs text-ink-secondary">
            We're working hard to improve this feature. Please check back soon.
          </p>
        {/if}
      </div>

      {#if variant === "full"}
        <div class="flex items-center gap-2">
          <span class="size-1.5 shrink-0 rounded-full bg-brand"></span>
          <span class="text-xs text-ink-secondary">Estimated completion: Soon</span>
        </div>
      {/if}
    </div>
  </div>
{:else if isUnderMaintenance && disableContent}
  <!-- Show content but disabled, with maintenance overlay -->
  <div class="relative w-full">
    <!-- Disabled content -->
    <div class="{compact ? 'opacity-60' : 'opacity-50'} pointer-events-none">
      <slot />
    </div>
    <!-- Maintenance overlay -->
    {#if compact}
      <!-- Compact overlay for buttons - shows icon badge -->
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="flex items-center gap-1.5 rounded-full border border-solid border-brand/30 bg-brand-soft px-3 py-1 text-brand">
          {#if showIcon}
            <Wrench class="size-3.5 shrink-0" aria-hidden="true" />
          {/if}
          <span class="whitespace-nowrap text-xs font-semibold">
            {message}
          </span>
        </div>
      </div>
    {:else}
      <!-- Full overlay for larger content -->
      <div class="absolute inset-0 flex items-center justify-center bg-paper/90 {cardClass}">
        <div class="flex flex-col items-center justify-center gap-3 text-center">
          {#if showIcon}
            <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Wrench class="size-6" aria-hidden="true" />
            </div>
          {/if}
          <p class="m-0 font-semibold text-brand {variant === 'minimal' ? 'text-xs' : 'text-sm'}">
            {message}
          </p>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Normal content display -->
  <slot />
{/if}

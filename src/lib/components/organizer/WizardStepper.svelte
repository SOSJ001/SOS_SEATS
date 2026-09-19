<script>
  // @ts-nocheck
  /** FR-8a create-wizard stepper (HI-FI 55:1132 desktop / 4:724 mobile). Do not use for editEvent. */
  import Check from "lucide-svelte/icons/check";

  export let currentStep = 1;

  const steps = [
    { id: 1, label: "Details", shortLabel: "Details" },
    { id: 2, label: "Ticket Types", shortLabel: "Types" },
    { id: 3, label: "Ticket Design", shortLabel: "Design" },
    { id: 4, label: "Publish", shortLabel: "Publish" },
    { id: 5, label: "Status", shortLabel: "Status" },
  ];

  $: isCompleted = (id) => id < currentStep;
  $: isCurrent = (id) => id === currentStep;
</script>

<nav class="mb-4 w-full lg:mb-6" aria-label="Create event steps">
  <!-- Mobile: HI-FI 4:724 / 506:107 stacked short labels, no connectors -->
  <ol class="flex w-full items-start justify-between gap-1 px-0 pb-4 lg:hidden">
    {#each steps as step}
      <li class="flex w-[64px] flex-col items-center gap-1.5">
        <div
          class="flex size-6 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold border-2
            {isCurrent(step.id)
              ? 'border-brand bg-brand text-white'
              : isCompleted(step.id)
                ? 'border-brand bg-[#fff1eb] text-brand'
                : 'border-paper-border bg-white text-ink-secondary'}"
          aria-current={isCurrent(step.id) ? "step" : undefined}
        >
          {#if isCompleted(step.id)}
            <Check size={12} strokeWidth={2.5} aria-hidden="true" />
          {:else}
            <span>{step.id}</span>
          {/if}
        </div>
        <span
          class="w-full text-center text-[11px] leading-tight
            {isCurrent(step.id)
              ? 'font-normal text-ink'
              : isCompleted(step.id)
                ? 'font-normal text-ink-secondary'
                : 'font-normal text-ink-secondary'}"
        >
          {step.shortLabel}
        </span>
      </li>
    {/each}
  </ol>

  <!-- Desktop: horizontal labels + connector rails -->
  <ol
    class="hidden min-w-max items-center overflow-x-auto border-b border-paper-border pb-4 lg:flex"
  >
    {#each steps as step, i}
      <li class="flex items-center shrink-0">
        <div class="flex items-center gap-2">
          <div
            class="flex size-6 shrink-0 items-center justify-center rounded-xl text-xs font-bold
              {isCompleted(step.id) || isCurrent(step.id)
                ? 'bg-brand text-white'
                : 'border-[1.5px] border-paper-border text-ink-secondary'}"
            aria-current={isCurrent(step.id) ? "step" : undefined}
          >
            {#if isCompleted(step.id)}
              <Check size={12} strokeWidth={2.5} aria-hidden="true" />
            {:else}
              <span>{step.id}</span>
            {/if}
          </div>
          <span
            class="whitespace-nowrap text-[13px]
              {isCompleted(step.id) || isCurrent(step.id)
                ? 'font-bold text-ink'
                : 'font-medium text-ink-secondary'}"
          >
            {step.label}
          </span>
        </div>
        {#if i < steps.length - 1}
          <span
            class="block h-0.5 w-[72px] shrink-0
              {step.id < currentStep ? 'bg-brand' : 'bg-[#d9d9d9]'}"
            aria-hidden="true"
          ></span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

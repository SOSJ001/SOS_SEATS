<script lang="ts">
  export let currentStep = 1;
  export let totalSteps = 5;
  export let steps = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Event Details" },
    { id: 3, label: "Ticket Settings" },
    { id: 4, label: "Audience" },
    { id: 5, label: "Review & Publish" },
  ];

  $: isCompleted = (stepId: number) => stepId < currentStep;
  $: isCurrent = (stepId: number) => stepId === currentStep;
</script>

<div class="flex justify-center mb-8 md:mb-12">
  <div class="flex items-center space-x-2 md:space-x-4 lg:space-x-8 px-4">
    {#each steps as step}
      <div class="flex flex-col items-center">
        <div
          class="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center mb-1 md:mb-2 transition-all duration-200 {isCompleted(
            step.id
          )
            ? 'bg-teal-400'
            : isCurrent(step.id)
              ? 'bg-teal-400'
              : 'bg-gray-600'}"
        >
          {#if isCompleted(step.id)}
            <!-- Checkmark for completed steps -->
            <svg
              class="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          {:else}
            <!-- Number for current and upcoming steps -->
            <span
              class="text-white font-bold text-sm md:text-base lg:text-lg {isCurrent(
                step.id
              )
                ? 'text-white'
                : 'text-gray-400'}"
            >
              {step.id}
            </span>
          {/if}
        </div>
        <span
          class="text-xs md:text-sm transition-colors duration-200 text-center {isCurrent(
            step.id
          )
            ? 'text-teal-400 font-medium'
            : 'text-gray-400'}"
        >
          {#if step.label.length > 8}
            <!-- For longer labels, show abbreviated version on mobile -->
            <span class="hidden sm:inline">{step.label}</span>
            <span class="sm:hidden">{step.label.split(" ")[0]}</span>
          {:else}
            <!-- For shorter labels, show full text on all screens -->
            {step.label}
          {/if}
        </span>
      </div>
    {/each}
  </div>
</div>

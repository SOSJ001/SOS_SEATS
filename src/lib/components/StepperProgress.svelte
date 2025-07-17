<script>
  export let currentStep = 1;
  export let totalSteps = 5;
  export let steps = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Event Image" },
    { id: 3, label: "Ticket Settings" },
    { id: 4, label: "Audience" },
    { id: 5, label: "Review & Publish" },
  ];

  $: isCompleted = (stepId) => stepId < currentStep;
  $: isCurrent = (stepId) => stepId === currentStep;
</script>

<div class="flex justify-center mb-12">
  <div class="flex items-center space-x-8">
    {#each steps as step}
      <div class="flex flex-col items-center">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200 {isCompleted(
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
              class="w-6 h-6 text-white"
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
              class="text-white font-bold text-lg {isCurrent(step.id)
                ? 'text-white'
                : 'text-gray-400'}"
            >
              {step.id}
            </span>
          {/if}
        </div>
        <span
          class="text-sm transition-colors duration-200 {isCurrent(step.id)
            ? 'text-teal-400 font-medium'
            : 'text-gray-400'}"
        >
          {step.label}
        </span>
      </div>
    {/each}
  </div>
</div>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData: any = {
    audienceType: "all-ages", // all-ages, 18-plus, 21-plus, family, corporate, students
    eventVisibility: "public", // public, private, invite-only
  };

  let errors: Record<string, string> = {};

  onMount(() => {
    // Load data from previous steps
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      eventData = { ...eventData, ...parsed };
    }
  });

  function validateStep() {
    errors = {};
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      localStorage.setItem("eventCreationData", JSON.stringify(eventData));
      goto("/dashboard/events/createEvent/step5");
    }
  }

  function prevStep() {
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events/createEvent/step3");
  }
</script>

<div class="max-w-6xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Create New Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={4} />

  <!-- Step Title -->
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-white mb-2">Event Settings</h2>
    <p class="text-gray-400">
      Configure your event's audience type and visibility settings.
    </p>
  </div>

  <!-- Form -->
  <div class="bg-gray-800 rounded-xl p-8 space-y-8">
    <!-- Audience Type -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Audience Type
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.audienceType}
            value="all-ages"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.audienceType ===
            'all-ages'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">All Ages</h3>
              <p class="text-sm text-gray-400">Suitable for all age groups</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.audienceType}
            value="18-plus"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.audienceType ===
            '18-plus'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">18+</h3>
              <p class="text-sm text-gray-400">Adults only (18 and older)</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.audienceType}
            value="21-plus"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.audienceType ===
            '21-plus'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">21+</h3>
              <p class="text-sm text-gray-400">Adults only (21 and older)</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.audienceType}
            value="family"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.audienceType ===
            'family'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Family</h3>
              <p class="text-sm text-gray-400">Family-friendly event</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.audienceType}
            value="corporate"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.audienceType ===
            'corporate'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Corporate</h3>
              <p class="text-sm text-gray-400">Business and professional</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.audienceType}
            value="students"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.audienceType ===
            'students'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Students</h3>
              <p class="text-sm text-gray-400">Student-focused event</p>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Event Visibility -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Event Visibility
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.eventVisibility}
            value="public"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.eventVisibility ===
            'public'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 12a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Public</h3>
              <p class="text-sm text-gray-400">Visible to everyone</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.eventVisibility}
            value="private"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.eventVisibility ===
            'private'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Private</h3>
              <p class="text-sm text-gray-400">Only you can see it</p>
            </div>
          </div>
        </label>

        <label class="relative">
          <input
            type="radio"
            bind:group={eventData.eventVisibility}
            value="invite-only"
            class="sr-only"
          />
          <div
            class="p-4 border-2 rounded-lg cursor-pointer transition-colors duration-200 {eventData.eventVisibility ===
            'invite-only'
              ? 'border-teal-400 bg-teal-400 bg-opacity-10'
              : 'border-gray-600 hover:border-gray-500'}"
          >
            <div class="text-center">
              <svg
                class="w-8 h-8 mx-auto mb-2 text-teal-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 8A6 6 0 006 8c0 3.207-1.845 5.216-4.608 6.43A1.5 1.5 0 002 16v2a1 1 0 001 1h14a1 1 0 001-1v-2a1 1 0 00-.392-.57C13.845 13.216 12 11.207 12 8z"
                  clip-rule="evenodd"
                />
              </svg>
              <h3 class="font-semibold text-white">Invite Only</h3>
              <p class="text-sm text-gray-400">Only invited guests can see</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>

  <!-- Navigation Buttons -->
  <div class="flex justify-between mt-8">
    <button
      on:click={prevStep}
      class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
    >
      Previous
    </button>

    <button
      on:click={nextStep}
      class="px-8 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium"
    >
      Next Step
    </button>
  </div>
</div>

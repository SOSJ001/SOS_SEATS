<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  // Get the event data from the server
  export let data;

  let eventData = {
    // Step 1 fields
    name: "",
    date: "",
    time: "",
    location: "",
    venue_address: "",
    description: "",

    // Step 2 fields
    category: "",
    tags: [],
    image: null,
    organizer: "",
    contact_email: "",
    website: "",
    social_media: {
      facebook: "",
      twitter: "",
      instagram: "",
    },

    // Step 3 fields
    is_free_event: false,
    seating_type: "general",
    total_capacity: null,
    ticket_types: [
      {
        name: "General Admission",
        description: "",
        price: 0.0,
        quantity: null,
        benefits: [],
      },
    ],
    venue_sections: [],
    seating_options: {
      allow_seat_selection: false,
      max_seats_per_order: 4,
      reserved_seating: false,
      has_seating_chart: false,
    },

    // Step 4 fields
    status: "draft", // Database: draft, published, cancelled
    visibility: "public", // Database: public, private, unlisted
    registration_required: false, // Database: BOOLEAN
    allow_waitlist: false, // Database: BOOLEAN
    max_waitlist_size: 50, // Database: INTEGER

    // Event timing
    registration_deadline: "", // Database: TIMESTAMP
    check_in_opens: "", // Database: TIME
    check_in_closes: "", // Database: TIME

    // Additional settings
    allow_refunds: false, // Database: BOOLEAN
    refund_policy: "", // Database: TEXT
    terms_conditions: "", // Database: TEXT
    privacy_policy: "", // Database: TEXT

    // Notification settings
    email_notifications: true, // Database: BOOLEAN
    sms_notifications: false, // Database: BOOLEAN
    reminder_emails: true, // Database: BOOLEAN
  };

  let errors = {};
  let error = data.error || "";
  let isLoading = true;

  $: eventId = $page.params.eventId;

    onMount(() => {
    console.log("Step4 - onMount started");
    console.log("Step4 - Server data:", data);
    
    // Always load from server data first to get the latest event data
    console.log("Step4 - Loading data from server:", data.event);
    if (data.event) {
      eventData = { ...eventData, ...data.event };
    }
    
    // Then merge with any localStorage data (for any changes made in this session)
    const savedData = localStorage.getItem("eventEditData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Step4 - Merging with localStorage data:", parsed);
      eventData = { ...eventData, ...parsed };
    }
    
    console.log("Step4 - Final eventData after merge:", eventData);
    isLoading = false;
  });

  function validateStep() {
    errors = {};

    if (eventData.registration_required && !eventData.registration_deadline) {
      errors.registrationDeadline =
        "Registration deadline is required when registration is required";
    }

    if (
      eventData.allow_waitlist &&
      (!eventData.max_waitlist_size || eventData.max_waitlist_size <= 0)
    ) {
      errors.maxWaitlistSize = "Valid waitlist size is required";
    }

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      console.log("Step4 - Saving data:", eventData);
      localStorage.setItem("eventEditData", JSON.stringify(eventData));
      goto(`/dashboard/events/editEvent/${eventId}/step5`);
    }
  }

  function prevStep() {
    localStorage.setItem("eventEditData", JSON.stringify(eventData));
    goto(`/dashboard/events/editEvent/${eventId}/step3`);
  }

  function goBack() {
    goto(`/dashboard/events/editEvent/${eventId}`);
  }
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Edit Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={4} />

  <!-- Step Title -->
  <div class="mb-6 sm:mb-8">
    <h2 class="text-xl sm:text-3xl font-bold text-white mb-2">
      Event Settings & Options
    </h2>
    <p class="text-gray-400 text-sm sm:text-base">
      Configure additional settings and options for your event.
    </p>
  </div>

  {#if error}
    <div class="bg-red-800 border border-red-600 rounded-lg p-6 text-center mb-6">
      <h3 class="text-xl font-bold text-white mb-2">Error Loading Event</h3>
      <p class="text-red-200 mb-4">{error}</p>
      <button
        on:click={() => goto('/dashboard/events')}
        class="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Back to Events
      </button>
    </div>
  {:else if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"
        ></div>
        <p class="text-gray-300">Loading event data...</p>
      </div>
    </div>
  {:else}

  <!-- Form -->
  <div class="bg-gray-800 rounded-xl p-4 sm:p-8 space-y-6">
    <!-- Event Status -->
    <div>
      <label for="status" class="block text-sm font-medium text-gray-300 mb-2">
        Event Status
      </label>
      <select
        id="status"
        bind:value={eventData.status}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Event Visibility -->
    <div>
      <label
        for="visibility"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Event Visibility
      </label>
      <select
        id="visibility"
        bind:value={eventData.visibility}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
      >
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="unlisted">Unlisted</option>
      </select>
    </div>

    <!-- Registration Settings -->
    <div class="border border-gray-600 rounded-lg p-4">
      <h3 class="text-lg font-medium text-white mb-4">Registration Settings</h3>

      <div class="space-y-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.registration_required}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Require registration</span>
        </label>

        {#if eventData.registration_required}
          <div>
            <label
              for="registration_deadline"
              class="block text-sm text-gray-400 mb-1"
            >
              Registration Deadline
            </label>
            <input
              id="registration_deadline"
              type="datetime-local"
              bind:value={eventData.registration_deadline}
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.registrationDeadline
                ? 'border-red-500'
                : ''}"
            />
            {#if errors.registrationDeadline}
              <p class="text-red-400 text-sm mt-1">
                {errors.registrationDeadline}
              </p>
            {/if}
          </div>
        {/if}

        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.allow_waitlist}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Allow waitlist</span>
        </label>

        {#if eventData.allow_waitlist}
          <div>
            <label
              for="max_waitlist_size"
              class="block text-sm text-gray-400 mb-1"
            >
              Maximum Waitlist Size
            </label>
            <input
              id="max_waitlist_size"
              type="number"
              bind:value={eventData.max_waitlist_size}
              min="1"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.maxWaitlistSize
                ? 'border-red-500'
                : ''}"
              placeholder="50"
            />
            {#if errors.maxWaitlistSize}
              <p class="text-red-400 text-sm mt-1">{errors.maxWaitlistSize}</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Check-in Settings -->
    <div class="border border-gray-600 rounded-lg p-4">
      <h3 class="text-lg font-medium text-white mb-4">Check-in Settings</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="check_in_opens" class="block text-sm text-gray-400 mb-1">
            Check-in Opens
          </label>
          <input
            id="check_in_opens"
            type="time"
            bind:value={eventData.check_in_opens}
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>

        <div>
          <label for="check_in_closes" class="block text-sm text-gray-400 mb-1">
            Check-in Closes
          </label>
          <input
            id="check_in_closes"
            type="time"
            bind:value={eventData.check_in_closes}
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
      </div>
    </div>

    <!-- Refund Settings -->
    <div class="border border-gray-600 rounded-lg p-4">
      <h3 class="text-lg font-medium text-white mb-4">Refund Settings</h3>

      <div class="space-y-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.allow_refunds}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Allow refunds</span>
        </label>

        {#if eventData.allow_refunds}
          <div>
            <label for="refund_policy" class="block text-sm text-gray-400 mb-1">
              Refund Policy
            </label>
            <textarea
              id="refund_policy"
              bind:value={eventData.refund_policy}
              rows="3"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="Describe your refund policy..."
            ></textarea>
          </div>
        {/if}
      </div>
    </div>

    <!-- Legal Documents -->
    <div class="border border-gray-600 rounded-lg p-4">
      <h3 class="text-lg font-medium text-white mb-4">Legal Documents</h3>

      <div class="space-y-4">
        <div>
          <label
            for="terms_conditions"
            class="block text-sm text-gray-400 mb-1"
          >
            Terms & Conditions
          </label>
          <textarea
            id="terms_conditions"
            bind:value={eventData.terms_conditions}
            rows="4"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="Enter terms and conditions..."
          ></textarea>
        </div>

        <div>
          <label for="privacy_policy" class="block text-sm text-gray-400 mb-1">
            Privacy Policy
          </label>
          <textarea
            id="privacy_policy"
            bind:value={eventData.privacy_policy}
            rows="4"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="Enter privacy policy..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Notification Settings -->
    <div class="border border-gray-600 rounded-lg p-4">
      <h3 class="text-lg font-medium text-white mb-4">Notification Settings</h3>

      <div class="space-y-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.email_notifications}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Email notifications</span>
        </label>

        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.sms_notifications}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">SMS notifications</span>
        </label>

        <label class="flex items-center">
          <input
            type="checkbox"
            bind:checked={eventData.reminder_emails}
            class="mr-3 text-teal-400 focus:ring-teal-400"
          />
          <span class="text-white">Send reminder emails</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Navigation Buttons -->
  <div
    class="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mt-6 sm:mt-8"
  >
    <button
      on:click={prevStep}
      class="w-full sm:w-auto px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base"
    >
      Previous
    </button>

    <button
      on:click={nextStep}
      class="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg hover:from-teal-500 hover:to-blue-600 transition-all duration-200 font-medium text-sm sm:text-base"
    >
      Next Step
    </button>
  </div>
  {/if}
</div>

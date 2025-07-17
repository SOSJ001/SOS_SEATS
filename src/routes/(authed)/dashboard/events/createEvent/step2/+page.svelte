<script>
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData = {
    category: "",
    tags: [],
    image: null,
    organizer: "",
    contactEmail: "",
    website: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
    },
  };

  let errors = {};
  let newTag = "";

  const categories = [
    "Music & Concerts",
    "Sports & Fitness",
    "Business & Professional",
    "Technology",
    "Arts & Culture",
    "Food & Drink",
    "Education",
    "Health & Wellness",
    "Entertainment",
    "Other",
  ];

  onMount(() => {
    // Load data from previous step
    const savedData = localStorage.getItem("eventCreationData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      eventData = { ...eventData, ...parsed };
    }
  });

  function addTag() {
    if (newTag.trim() && !eventData.tags.includes(newTag.trim())) {
      eventData.tags = [...eventData.tags, newTag.trim()];
      newTag = "";
    }
  }

  function removeTag(tagToRemove) {
    eventData.tags = eventData.tags.filter((tag) => tag !== tagToRemove);
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      eventData.image = file;
    }
  }

  function validateStep() {
    errors = {};

    if (!eventData.category) {
      errors.category = "Please select a category";
    }
    if (!eventData.organizer.trim()) {
      errors.organizer = "Organizer name is required";
    }
    if (!eventData.contactEmail.trim()) {
      errors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eventData.contactEmail)) {
      errors.contactEmail = "Please enter a valid email";
    }

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      // Save to localStorage
      localStorage.setItem("eventCreationData", JSON.stringify(eventData));
      goto("/dashboard/events/createEvent/step3");
    }
  }

  function prevStep() {
    localStorage.setItem("eventCreationData", JSON.stringify(eventData));
    goto("/dashboard/events/createEvent/step1");
  }
</script>

<div class="max-w-6xl mx-auto p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Create New Event</h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={2} />

  <!-- Step Title -->
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-white mb-2">Event Details</h2>
    <p class="text-gray-400">
      Add more details to help people discover your event.
    </p>
  </div>

  <!-- Form -->
  <div class="bg-gray-800 rounded-xl p-8 space-y-6">
    <!-- Category -->
    <div>
      <label
        for="category"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Event Category *
      </label>
      <select
        id="category"
        bind:value={eventData.category}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.category
          ? 'border-red-500'
          : ''}"
      >
        <option value="">Select a category</option>
        {#each categories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
      {#if errors.category}
        <p class="text-red-400 text-sm mt-1">{errors.category}</p>
      {/if}
    </div>

    <!-- Tags -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Event Tags
      </label>
      <div class="flex gap-2 mb-2">
        <input
          type="text"
          bind:value={newTag}
          on:keydown={(e) => e.key === "Enter" && addTag()}
          class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          placeholder="Add a tag and press Enter"
        />
        <button
          on:click={addTag}
          class="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200"
        >
          Add
        </button>
      </div>
      {#if eventData.tags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each eventData.tags as tag}
            <span
              class="inline-flex items-center px-3 py-1 bg-teal-500 text-white text-sm rounded-full"
            >
              {tag}
              <button
                on:click={() => removeTag(tag)}
                class="ml-2 text-teal-200 hover:text-white"
              >
                ×
              </button>
            </span>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Image Upload -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Event Image
      </label>
      <div
        class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center"
      >
        <input
          type="file"
          accept="image/*"
          on:change={handleImageUpload}
          class="hidden"
          id="image-upload"
        />
        <label for="image-upload" class="cursor-pointer">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="mt-2 text-sm text-gray-400">
            Click to upload an image or drag and drop
          </p>
          <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
        </label>
      </div>
    </div>

    <!-- Organizer Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label
          for="organizer"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Organizer Name *
        </label>
        <input
          id="organizer"
          type="text"
          bind:value={eventData.organizer}
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.organizer
            ? 'border-red-500'
            : ''}"
          placeholder="Enter organizer name"
        />
        {#if errors.organizer}
          <p class="text-red-400 text-sm mt-1">{errors.organizer}</p>
        {/if}
      </div>

      <div>
        <label
          for="contactEmail"
          class="block text-sm font-medium text-gray-300 mb-2"
        >
          Contact Email *
        </label>
        <input
          id="contactEmail"
          type="email"
          bind:value={eventData.contactEmail}
          class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent {errors.contactEmail
            ? 'border-red-500'
            : ''}"
          placeholder="Enter contact email"
        />
        {#if errors.contactEmail}
          <p class="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
        {/if}
      </div>
    </div>

    <!-- Website -->
    <div>
      <label
        for="website"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Website
      </label>
      <input
        id="website"
        type="url"
        bind:value={eventData.website}
        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        placeholder="https://example.com"
      />
    </div>

    <!-- Social Media -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-4">
        Social Media Links
      </label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            for="facebook"
            class="block text-xs font-medium text-gray-400 mb-1"
          >
            Facebook
          </label>
          <input
            id="facebook"
            type="url"
            bind:value={eventData.socialMedia.facebook}
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
            placeholder="Facebook URL"
          />
        </div>
        <div>
          <label
            for="twitter"
            class="block text-xs font-medium text-gray-400 mb-1"
          >
            Twitter
          </label>
          <input
            id="twitter"
            type="url"
            bind:value={eventData.socialMedia.twitter}
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
            placeholder="Twitter URL"
          />
        </div>
        <div>
          <label
            for="instagram"
            class="block text-xs font-medium text-gray-400 mb-1"
          >
            Instagram
          </label>
          <input
            id="instagram"
            type="url"
            bind:value={eventData.socialMedia.instagram}
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
            placeholder="Instagram URL"
          />
        </div>
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

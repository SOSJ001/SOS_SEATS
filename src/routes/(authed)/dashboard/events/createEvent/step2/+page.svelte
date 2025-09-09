<script>
  import { goto } from "$app/navigation";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import StepperProgress from "$lib/components/StepperProgress.svelte";

  let eventData = {
    // Event details for database
    category: "", // Database: TEXT
    tags: [], // Database: TEXT[]
    image: null, // Will be handled separately for storage
    organizer: "", // Database: TEXT
    contact_email: "", // Database: TEXT (field name)
    website: "", // Database: TEXT
    social_media: {
      // Database: JSONB
      facebook: "",
      twitter: "",
      instagram: "",
    },
  };

  let errors = {};
  let newTag = "";
  let imagePreview = null;

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
      // If there's a saved image, create preview (note: File objects can't be serialized to JSON)
      // So we'll need to handle this differently - the image will need to be re-uploaded
      if (parsed.imagePreview) {
        imagePreview = parsed.imagePreview;
      }
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

      // Create preview URL
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
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
    if (!eventData.contact_email.trim()) {
      errors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eventData.contact_email)) {
      errors.contactEmail = "Please enter a valid email";
    }

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep()) {
      // Save to localStorage (including image preview)
      const dataToSave = {
        ...eventData,
        imagePreview: imagePreview,
      };
      localStorage.setItem("eventCreationData", JSON.stringify(dataToSave));
      goto("/dashboard/events/createEvent/step3");
    }
  }

  function prevStep() {
    // Save to localStorage (including image preview)
    const dataToSave = {
      ...eventData,
      imagePreview: imagePreview,
    };
    localStorage.setItem("eventCreationData", JSON.stringify(dataToSave));
    goto("/dashboard/events/createEvent/step1");
  }
</script>

<div class="max-w-4xl mx-auto p-4 sm:p-6" in:fade={{ duration: 300 }}>
  <!-- Title -->
  <div class="text-center mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
      Create New Event
    </h1>
  </div>

  <!-- Stepper Progress -->
  <StepperProgress currentStep={2} />

  <!-- Step Title -->
  <div class="mb-6 sm:mb-8">
    <h2 class="text-xl sm:text-3xl font-bold text-white mb-2">Event Details</h2>
    <p class="text-gray-400 text-sm sm:text-base">
      Add more details to help people discover your event.
    </p>
  </div>

  <!-- Form -->
  <div class="bg-gray-800 rounded-xl p-4 sm:p-8 space-y-4 sm:space-y-6">
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
      <label
        for="event-tags"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Event Tags
      </label>
      <div class="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          id="event-tags"
          type="text"
          bind:value={newTag}
          on:keydown={(e) => e.key === "Enter" && addTag()}
          class="flex-1 px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm sm:text-base"
          placeholder="Add a tag and press Enter"
        />
        <button
          on:click={addTag}
          class="w-full sm:w-auto px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors duration-200 text-sm sm:text-base font-medium"
        >
          Add Tag
        </button>
      </div>
      {#if eventData.tags.length > 0}
        <div class="flex flex-wrap gap-2 mt-3">
          {#each eventData.tags as tag}
            <span
              class="inline-flex items-center px-2 sm:px-3 py-1 bg-teal-500 text-white text-xs sm:text-sm rounded-full"
            >
              {tag}
              <button
                on:click={() => removeTag(tag)}
                class="ml-1 sm:ml-2 text-teal-200 hover:text-white text-sm sm:text-base"
                aria-label="Remove tag {tag}"
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
      <label
        for="image-upload"
        class="block text-sm font-medium text-gray-300 mb-2"
      >
        Event Image
      </label>

      {#if imagePreview}
        <!-- Image Preview -->
        <div class="mb-4">
          <div class="relative inline-block">
            <img
              src={imagePreview}
              alt=""
              class="max-w-full h-64 object-cover rounded-lg border border-gray-600"
            />
            <button
              on:click={() => {
                eventData.image = null;
                imagePreview = null;
              }}
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              ×
            </button>
          </div>
          <p class="text-sm text-gray-400 mt-2">
            {eventData.image?.name || "Image uploaded"}
          </p>
        </div>
      {/if}

      {#if !imagePreview}
        <!-- Upload Area -->
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
      {:else}
        <!-- Change Image Button -->
        <div class="text-center">
          <input
            type="file"
            accept="image/*"
            on:change={handleImageUpload}
            class="hidden"
            id="change-image-upload"
          />
          <label
            for="change-image-upload"
            class="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Change Image
          </label>
        </div>
      {/if}
    </div>

    <!-- Organizer Information -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
          bind:value={eventData.contact_email}
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
      <label for="website" class="block text-sm font-medium text-gray-300 mb-2">
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
      <h3 class="block text-sm font-medium text-gray-300 mb-4">
        Social Media Links
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            bind:value={eventData.social_media.facebook}
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
            bind:value={eventData.social_media.twitter}
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
            bind:value={eventData.social_media.instagram}
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
            placeholder="Instagram URL"
          />
        </div>
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
</div>

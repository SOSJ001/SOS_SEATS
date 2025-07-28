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
  let error = data.error || "";
  let isLoading = true;
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

  $: eventId = $page.params.eventId;

  onMount(() => {
    console.log("Step2 - onMount started");
    console.log("Step2 - Server data:", data);

    // Always load from server data first to get the latest event data
    console.log("Step2 - Loading data from server:", data.event);
    if (data.event) {
      eventData = { ...eventData, ...data.event };

      // Handle existing image from server
      if (data.event.image && data.event.image.file_path) {
        imagePreview = data.event.image.file_path;
        console.log("Step2 - Loaded existing image:", imagePreview);
      }
    }

    // Then merge with any localStorage data (for any changes made in this session)
    const savedData = localStorage.getItem("eventEditData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("Step2 - Merging with localStorage data:", parsed);
      eventData = { ...eventData, ...parsed };

      // If there's a saved image preview, use it
      if (parsed.imagePreview) {
        imagePreview = parsed.imagePreview;
      }
    }

    console.log("Step2 - Final eventData after merge:", eventData);
    console.log("Step2 - Final imagePreview:", imagePreview);
    isLoading = false;
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
      // Save to localStorage before navigating
      console.log("Step2 - Saving data:", eventData);
      console.log("Step2 - Saving imagePreview:", imagePreview);
      
      // Save eventData with imagePreview
      const dataToSave = {
        ...eventData,
        imagePreview: imagePreview
      };
      
      localStorage.setItem("eventEditData", JSON.stringify(dataToSave));
      goto(`/dashboard/events/editEvent/${eventId}/step3`);
    }
  }

  function prevStep() {
    // Save current data before going back
    console.log("Step2 - Saving data on prevStep:", eventData);
    console.log("Step2 - Saving imagePreview on prevStep:", imagePreview);
    
    // Save eventData with imagePreview
    const dataToSave = {
      ...eventData,
      imagePreview: imagePreview
    };
    
    localStorage.setItem("eventEditData", JSON.stringify(dataToSave));
    goto(`/dashboard/events/editEvent/${eventId}/step1`);
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
  <StepperProgress currentStep={2} />

  <!-- Step Title -->
  <div class="mb-6 sm:mb-8">
    <h2 class="text-xl sm:text-3xl font-bold text-white mb-2">Event Details</h2>
    <p class="text-gray-400 text-sm sm:text-base">
      Add more details to help people discover your event.
    </p>
  </div>

  {#if error}
    <div
      class="bg-red-800 border border-red-600 rounded-lg p-6 text-center mb-6"
    >
      <h3 class="text-xl font-bold text-white mb-2">Error Loading Event</h3>
      <p class="text-red-200 mb-4">{error}</p>
      <button
        on:click={() => goto("/dashboard/events")}
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
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Event Tags
        </label>
        <div class="flex flex-wrap gap-2 mb-2">
          {#each eventData.tags as tag}
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-teal-600 text-white"
            >
              {tag}
              <button
                type="button"
                on:click={() => removeTag(tag)}
                class="ml-2 text-teal-200 hover:text-white"
              >
                ×
              </button>
            </span>
          {/each}
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={newTag}
            on:keydown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTag())}
            class="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            on:click={addTag}
            class="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
          >
            Add
          </button>
        </div>
      </div>

      <!-- Event Image -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Event Image
        </label>
        <div class="space-y-4">
          {#if imagePreview}
            <div class="relative">
              <img
                src={imagePreview}
                alt="Event preview"
                class="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                on:click={() => {
                  imagePreview = null;
                  eventData.image = null;
                }}
                class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors duration-200"
              >
                ×
              </button>
            </div>
          {/if}
          <input
            type="file"
            accept="image/*"
            on:change={handleImageUpload}
            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
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
            for="contact_email"
            class="block text-sm font-medium text-gray-300 mb-2"
          >
            Contact Email *
          </label>
          <input
            id="contact_email"
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
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Social Media Links
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label for="facebook" class="block text-xs text-gray-400 mb-1">
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
            <label for="twitter" class="block text-xs text-gray-400 mb-1">
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
            <label for="instagram" class="block text-xs text-gray-400 mb-1">
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
  {/if}
</div>

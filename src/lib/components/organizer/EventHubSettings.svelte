<script>
  // @ts-nocheck
  /** Event hub Settings tab: category, tags, links, contact email, order limit. */
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import LayoutGrid from "lucide-svelte/icons/layout-grid";
  import Tag from "lucide-svelte/icons/tag";
  import Link from "lucide-svelte/icons/link";
  import Mail from "lucide-svelte/icons/mail";
  import Ticket from "lucide-svelte/icons/ticket";
  import WizardField from "$lib/components/organizer/WizardField.svelte";
  import TagInput from "$lib/components/organizer/TagInput.svelte";
  import HubSettingsSection from "$lib/components/organizer/HubSettingsSection.svelte";
  import { DEFAULT_CATEGORY, EVENT_CATEGORIES, isEventCategory } from "$lib/eventCategories";
  import { EVENT_LIMITS } from "$lib/eventLimits";
  import { showToast } from "$lib/store";

  /** @type {{ category: string, tags: string[], website: string, social_media: { facebook: string, twitter: string, instagram: string }, contact_email: string, maxPerOrder: number }} */
  export let settings;
  /** @type {{ error?: string, values?: any, success?: boolean } | null} */
  export let form = null;

  let saving = false;
  let values = fromSettings(form?.values || settings);

  function fromSettings(s) {
    const social = s?.social_media || {};
    return {
      category: isEventCategory(s?.category) ? s.category : DEFAULT_CATEGORY,
      tags: Array.isArray(s?.tags) ? [...s.tags] : [],
      website: s?.website || "",
      facebook: social.facebook || "",
      twitter: social.twitter || "",
      instagram: social.instagram || "",
      contact_email: s?.contact_email || "",
      maxPerOrder: String(s?.maxPerOrder ?? 1),
    };
  }

  $: action = `?id=${encodeURIComponent($page.url.searchParams.get("id") || "")}&tab=settings&/saveSettings`;

  function submit() {
    saving = true;
    return async ({ result, update }) => {
      saving = false;
      if (result.type === "success") {
        await update({ reset: false });
        values = fromSettings(settings);
        showToast("success", "Settings saved", "Your event settings have been updated.");
      } else if (result.type === "failure") {
        await update({ reset: false });
        showToast("error", "Save failed", result.data?.error || "Could not save settings");
      } else {
        await update();
      }
    };
  }
</script>

<form method="POST" {action} use:enhance={submit} class="flex flex-col gap-4 lg:gap-6">
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
    <HubSettingsSection
      icon={LayoutGrid}
      title="Category"
      description="Helps people find your event in browse and on the home page."
    >
      <WizardField id="settings-category" name="category" label="Category" type="select" bind:value={values.category}>
        {#each EVENT_CATEGORIES as category}
          <option value={category}>{category}</option>
        {/each}
      </WizardField>
    </HubSettingsSection>

    <HubSettingsSection
      icon={Tag}
      title="Tags"
      description="Short keywords people can search for, like afrobeats or rooftop."
    >
      <div class="flex flex-col gap-1.5">
        <label for="settings-tags" class="text-[13px] font-bold text-ink">Tags</label>
        <TagInput
          id="settings-tags"
          name="tags"
          bind:tags={values.tags}
          max={EVENT_LIMITS.tagsMax}
          maxLength={EVENT_LIMITS.tagLength}
        />
      </div>
    </HubSettingsSection>

    <HubSettingsSection
      icon={Link}
      title="Links"
      description="Shown on your event page. https:// is added if you leave it out."
    >
      <div class="flex flex-col gap-3">
        <WizardField
          id="settings-website"
          name="website"
          label="Website"
          inputmode="url"
          bind:value={values.website}
          maxlength={EVENT_LIMITS.url}
          placeholder="e.g. freetownfest.com"
        />
        <WizardField
          id="settings-facebook"
          name="facebook"
          label="Facebook"
          inputmode="url"
          bind:value={values.facebook}
          maxlength={EVENT_LIMITS.url}
          placeholder="e.g. facebook.com/yourpage"
        />
        <WizardField
          id="settings-twitter"
          name="twitter"
          label="Twitter / X"
          inputmode="url"
          bind:value={values.twitter}
          maxlength={EVENT_LIMITS.url}
          placeholder="e.g. x.com/yourhandle"
        />
        <WizardField
          id="settings-instagram"
          name="instagram"
          label="Instagram"
          inputmode="url"
          bind:value={values.instagram}
          maxlength={EVENT_LIMITS.url}
          placeholder="e.g. instagram.com/yourhandle"
        />
      </div>
    </HubSettingsSection>

    <div class="flex flex-col gap-4 lg:gap-6">
      <HubSettingsSection
        icon={Mail}
        title="Contact email"
        description="Where attendees can reach you with questions."
      >
        <WizardField
          id="settings-email"
          name="contact_email"
          label="Email"
          type="email"
          bind:value={values.contact_email}
          maxlength={EVENT_LIMITS.email}
          placeholder="e.g. hello@freetownfest.com"
        />
      </HubSettingsSection>

      <HubSettingsSection
        icon={Ticket}
        title="Max tickets per type, per order"
        description="Applies to free tickets. Paid checkout is one ticket per order for now."
      >
        <WizardField
          id="settings-max-per-order"
          name="maxPerOrder"
          label="Max per type"
          type="number"
          min={1}
          max={EVENT_LIMITS.maxPerOrderMax}
          step={1}
          bind:value={values.maxPerOrder}
        />
      </HubSettingsSection>
    </div>
  </div>

  {#if form?.error}
    <p class="m-0 text-sm text-red-600" role="alert">{form.error}</p>
  {/if}

  <div class="flex justify-end border-t border-paper-border pt-4 lg:pt-6">
    <button
      type="submit"
      disabled={saving}
      class="w-full rounded-lg border-0 bg-brand px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
    >
      {saving ? "Saving…" : "Save settings"}
    </button>
  </div>
</form>

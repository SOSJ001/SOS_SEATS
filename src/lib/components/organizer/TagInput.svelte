<script>
  // @ts-nocheck
  /** Chip input: Enter or comma adds a tag, x removes it. Posts one hidden `name` field per tag. */
  import X from "lucide-svelte/icons/x";
  import Hash from "lucide-svelte/icons/hash";

  export let id = "tags";
  export let name = "tags";
  /** @type {string[]} */
  export let tags = [];
  export let max = 10;
  export let maxLength = 30;
  export let placeholder = "Add a tag and press Enter";

  let draft = "";
  let hint = "";

  function clean(value) {
    return String(value || "")
      .replace(/^#+/, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function addFromDraft() {
    const parts = draft.split(",").map(clean).filter(Boolean);
    draft = "";
    hint = "";
    for (const tag of parts) {
      if (tags.length >= max) {
        hint = `Up to ${max} tags`;
        break;
      }
      if (tag.length > maxLength) {
        hint = `Tags can be at most ${maxLength} characters`;
        continue;
      }
      if (!tags.includes(tag)) tags = [...tags, tag];
    }
  }

  function remove(tag) {
    tags = tags.filter((t) => t !== tag);
    hint = "";
  }

  function onKeydown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromDraft();
    } else if (e.key === "Backspace" && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  }

  $: full = tags.length >= max;
</script>

<div
  class="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-paper-border bg-white px-2.5 py-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
>
  {#each tags as tag (tag)}
    <span
      class="inline-flex items-center gap-1 rounded-full bg-brand-wash py-1 pl-2.5 pr-1 text-[13px] font-semibold text-brand"
    >
      <Hash size={12} aria-hidden="true" />
      {tag}
      <button
        type="button"
        class="flex size-5 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-brand hover:bg-brand/10"
        aria-label="Remove tag {tag}"
        on:click={() => remove(tag)}
      >
        <X size={12} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </span>
    <input type="hidden" {name} value={tag} />
  {/each}
  <input
    {id}
    type="text"
    bind:value={draft}
    maxlength={maxLength + 1}
    disabled={full}
    placeholder={full ? "" : placeholder}
    class="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-base text-ink placeholder:text-[#999] focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
    on:keydown={onKeydown}
    on:blur={addFromDraft}
  />
</div>
<p class="m-0 mt-1 text-[12px] text-ink-secondary">
  {hint || `${tags.length}/${max} tags. Press Enter or comma to add.`}
</p>

<script>
  // @ts-nocheck
  import FlaskConical from "lucide-svelte/icons/flask-conical";
  import TriangleAlert from "lucide-svelte/icons/triangle-alert";
  import List from "lucide-svelte/icons/list";
  import { LEGAL, unfilledLegalKeys } from "$lib/legal/legalConfig.js";

  export let title = "";
  /** @type {{ id: string, title: string }[]} */
  export let sections = [];
  /** @type {{ href: string, label: string } | null} */
  export let related = null;

  const missing = import.meta.env.DEV ? unfilledLegalKeys() : [];
</script>

<svelte:head>
  <title>{title} · SOS SEATS</title>
</svelte:head>

<div class="mx-auto w-full max-w-[760px] px-5 py-8 lg:py-12">
  {#if missing.length}
    <div
      class="mb-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] leading-5 text-red-800"
      role="alert"
    >
      <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p class="m-0">
        <strong>Development only:</strong> fill in {missing.join(", ")} in
        <code>src/lib/legal/legalConfig.js</code> before sharing the site. A policy that doesn't name its
        operator and contact is not valid.
      </p>
    </div>
  {/if}

  <header class="mb-6">
    <h1 class="m-0 font-display text-2xl font-bold text-ink lg:text-[28px]">{title}</h1>
    <p class="m-0 mt-2 text-[13px] text-ink-secondary">Effective {LEGAL.effectiveDate}</p>
  </header>

  <div
    class="mb-6 flex gap-3 rounded-xl border border-brand/20 bg-brand-soft p-4 text-[13px] leading-5 text-ink-body"
  >
    <FlaskConical class="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
    <p class="m-0">
      <strong class="text-ink">Test project.</strong> SOS SEATS is a personal, non-commercial pilot run
      by {LEGAL.operatorName}. It is not a registered company. Features may change, break or stop.
    </p>
  </div>

  {#if sections.length}
    <nav
      class="mb-8 rounded-xl border border-paper-border bg-white p-4 shadow-public-card"
      aria-label="Contents"
    >
      <p class="m-0 mb-2 flex items-center gap-2 text-[13px] font-bold text-ink">
        <List class="size-4 text-brand" aria-hidden="true" />
        Contents
      </p>
      <ol class="m-0 grid list-decimal gap-x-6 gap-y-1 pl-5 text-[13px] text-ink-secondary sm:grid-cols-2">
        {#each sections as section}
          <li>
            <a href="#{section.id}" class="text-ink-secondary no-underline hover:text-brand">
              {section.title}
            </a>
          </li>
        {/each}
      </ol>
    </nav>
  {/if}

  <div class="flex flex-col gap-6">
    <slot />
  </div>

  {#if related}
    <p class="m-0 mt-10 border-t border-paper-border pt-6 text-[13px] text-ink-secondary">
      See also: <a href={related.href} class="font-semibold text-brand no-underline hover:underline"
        >{related.label}</a
      >
    </p>
  {/if}
</div>

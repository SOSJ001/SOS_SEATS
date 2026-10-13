<script>
  // @ts-nocheck
  /** Mobile auth header row: wordmark plus the exit link. */
  import AuthWordmark from "$lib/components/auth/AuthWordmark.svelte";
  import AuthBackLink from "$lib/components/auth/AuthBackLink.svelte";
</script>

<div class="flex w-full items-center justify-between gap-3">
  <AuthWordmark size="mobile" />
  <AuthBackLink />
</div>

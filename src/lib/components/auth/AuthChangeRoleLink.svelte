<script>
  // @ts-nocheck
  /** Back to the role selector, keeping `next`. */
  import { page } from "$app/stores";
  import { authSearchParams } from "$lib/auth/postAuthRedirect.js";

  let className = "";
  export { className as class };

  $: href = `/sign-in${authSearchParams({ next: $page.url.searchParams.get("next") })}`;
</script>

<p class="m-0 w-full text-center text-sm text-ink-secondary {className}">
  Wrong account type?
  <a {href} class="font-bold text-brand hover:underline">Choose another role</a>
</p>

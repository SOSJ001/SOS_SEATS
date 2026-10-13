<script>
  // @ts-nocheck
  /** Exit link for auth pages: back to the event in `next`, else home. */
  import { page } from "$app/stores";
  import ArrowLeft from "lucide-svelte/icons/arrow-left";
  import { authExitTarget } from "$lib/auth/postAuthRedirect.js";

  $: target = authExitTarget($page.url.searchParams.get("next"));
</script>

<a
  href={target.href}
  class="inline-flex items-center gap-1.5 text-[13px] text-ink-secondary no-underline hover:text-ink"
>
  <ArrowLeft size={16} aria-hidden="true" />
  {target.label}
</a>

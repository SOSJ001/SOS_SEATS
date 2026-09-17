<script>
  // @ts-nocheck
  import { goto } from "$app/navigation";
  import { sessionFromDb } from "$lib/store";

  $: isLoggedIn = !!$sessionFromDb;

  const socials = [
    { name: "Instagram", href: "#", src: "/hifi/social/instagram.svg" },
    { name: "Facebook", href: "#", src: "/hifi/social/facebook.svg" },
    { name: "Twitter", href: "#", src: "/hifi/social/twitter.svg" },
    { name: "LinkedIn", href: "#", src: "/hifi/social/linkedin.svg" },
  ];

  function goOrLogin(next) {
    if (isLoggedIn) goto(next);
    else goto(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  const colLink =
    "text-[13px] text-ink-muted bg-transparent border-0 p-0 text-left cursor-pointer hover:text-brand";
</script>

<footer class="bg-slate-public text-white/85 mt-auto">
  <div
    class="max-w-[1280px] mx-auto px-5 py-8 md:px-20 md:pt-[60px] md:pb-10 flex flex-col gap-8 md:gap-10"
  >
    <div class="h-1 w-full rounded-sm bg-public-footer-accent" aria-hidden="true"></div>

    <div class="flex flex-col gap-8 md:flex-row md:justify-between md:gap-12">
      <div class="max-w-[360px]">
        <div class="w-16 h-1 bg-brand rounded-sm mb-4" aria-hidden="true"></div>
        <p class="m-0 text-base font-bold leading-[26px] text-white">
          Sierra Leone's premier secure event ticketing platform. Directly integrated with Orange
          Money and Afrimoney.
        </p>
      </div>

      <div class="flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:gap-12 md:gap-16">
        <div class="flex flex-col gap-3 min-w-[100px]">
          <h3 class="m-0 mb-1 text-sm font-extrabold text-white">Platform</h3>
          <a href="/marketplace" class={colLink}>Browse Events</a>
          <button
            type="button"
            class={colLink}
            on:click={() => goOrLogin("/dashboard/events/createEvent")}
          >
            Create Event
          </button>
          <a href="/#fees" class={colLink}>Pricing &amp; Fees</a>
        </div>
        <div class="flex flex-col gap-3 min-w-[100px]">
          <h3 class="m-0 mb-1 text-sm font-extrabold text-white">Local Integration</h3>
          <span class="text-[13px] text-ink-muted">Orange Money</span>
          <span class="text-[13px] text-ink-muted">Afrimoney</span>
          <span class="text-[13px] text-ink-muted">Mobile Money</span>
        </div>
        <div class="flex flex-col gap-3 min-w-[100px]">
          <h3 class="m-0 mb-1 text-sm font-extrabold text-white">Support</h3>
          <span class="text-[13px] text-ink-muted">Help Centre</span>
          <span class="text-[13px] text-ink-muted">Terms of Service</span>
          <span class="text-[13px] text-ink-muted">Privacy Policy</span>
        </div>
      </div>
    </div>

    <div class="flex gap-3 items-center" aria-label="Social links">
      {#each socials as s}
        <a
          class="w-10 h-10 rounded-xl bg-slate-chip inline-flex items-center justify-center hover:bg-slate-600"
          href={s.href}
          aria-label={s.name}
        >
          <img src={s.src} alt="" width="18" height="18" />
        </a>
      {/each}
    </div>

    <div class="h-px bg-white/10" aria-hidden="true"></div>

    <div class="flex flex-col items-start gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <p class="m-0 text-[13px] text-ink-muted">© 2026 SOS SEATS Ltd. Freetown, Sierra Leone.</p>
      <div class="flex gap-2">
        <span class="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-chip text-white"
          >Orange Money</span
        >
        <span class="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-chip text-white"
          >Afrimoney</span
        >
      </div>
    </div>
  </div>
</footer>

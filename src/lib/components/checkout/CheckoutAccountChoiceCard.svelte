<script>
  // @ts-nocheck
  /**
   * Checkout account choice card (roadmap 5.8) - mobile HI-FI 1397:5083 / desktop 1397:5132.
   * Paid checkout and free claim share the layout; only the copy changes.
   */
  import UserPlus from "lucide-svelte/icons/user-plus";
  import LogIn from "lucide-svelte/icons/log-in";
  import AccountChoiceOption from "./AccountChoiceOption.svelte";

  /** @type {"checkout" | "claim"} */
  export let intent = "checkout";
  export let createHref = "";
  export let signInHref = "";

  const COPY = {
    checkout: {
      heading: "Continue checkout",
      explanation:
        "An account is required to continue checkout. Your purchased tickets and entry QR stay accessible in My Tickets.",
      noticeTitle: "Payment hasn't started.",
      noticeDetail: "No payment code generated yet.",
      nextStep:
        "After creating an account or signing in, return to checkout to generate the payment code.",
    },
    claim: {
      heading: "Continue claim",
      explanation:
        "An account is required to claim this ticket. Your claimed tickets and entry QR stay accessible in My Tickets.",
      noticeTitle: "Nothing claimed yet.",
      noticeDetail: "Your ticket is issued after you confirm.",
      nextStep:
        "After creating an account or signing in, return to confirm your claim.",
    },
  };

  $: copy = COPY[intent] || COPY.checkout;
</script>

<div
  class="flex w-full flex-col gap-6 lg:gap-4 lg:rounded-xl lg:border lg:border-paper-border lg:bg-white lg:p-4 lg:shadow-[0px_8px_24px_-8px_rgba(18,4,28,0.04)]"
>
  <div class="flex flex-col gap-3 lg:gap-1.5">
    <h1
      class="m-0 text-[28px] font-extrabold leading-[1.15] text-ink lg:text-2xl lg:leading-tight"
    >
      {copy.heading}<br />with an account
    </h1>
    <p class="m-0 text-sm leading-5 text-ink-secondary lg:text-[12px] lg:leading-snug">
      {copy.explanation}
    </p>
  </div>

  <div class="flex flex-col gap-3 lg:gap-2">
    <AccountChoiceOption
      href={createHref}
      icon={UserPlus}
      title="Create account"
      audience="New to SOS SEATS"
      guidance="Use a username, email or phone, and password."
      highlighted
    />
    <AccountChoiceOption
      href={signInHref}
      icon={LogIn}
      title="Sign in"
      audience="Already have an account"
      guidance="Use your username and password."
    />
  </div>

  <div
    class="flex items-center gap-3 rounded-xl border border-paper-border bg-white p-3 lg:gap-2.5 lg:rounded-lg lg:px-3 lg:py-2.5"
  >
    <span class="size-5 shrink-0 rounded-full bg-brand lg:size-4" aria-hidden="true"></span>
    <p class="m-0 text-[13px] leading-[18px] text-ink-secondary lg:text-[12px] lg:leading-snug">
      {copy.noticeTitle}<br />{copy.noticeDetail}
    </p>
  </div>

  <div class="flex flex-col gap-1">
    <p class="m-0 text-[13px] font-bold leading-[18px] text-ink lg:text-[12px]">
      What happens next?
    </p>
    <p class="m-0 text-[13px] leading-[18px] text-ink-secondary lg:text-[12px] lg:leading-snug">
      {copy.nextStep}
    </p>
  </div>
</div>

<script>
  import LegalPage from "$lib/components/legal/LegalPage.svelte";
  import LegalSection from "$lib/components/legal/LegalSection.svelte";
  import { LEGAL } from "$lib/legal/legalConfig.js";
  import {
    formatBookingFeeLabel,
    formatPlatformFeePercent,
    formatWithdrawalMonimeFeePercent,
    isBookingFeeFlat,
  } from "$lib/fees.js";

  const bookingFee = isBookingFeeFlat()
    ? `${formatBookingFeeLabel()} per order`
    : formatBookingFeeLabel();
  const platformFee = formatPlatformFeePercent();
  const providerFee = formatWithdrawalMonimeFeePercent();

  const sections = [
    { id: "about", title: "About SOS SEATS and its test status" },
    { id: "eligibility", title: "Eligibility and accounts" },
    { id: "what-we-are", title: "What SOS SEATS is (and is not)" },
    { id: "organisers", title: "Organiser duties" },
    { id: "payments", title: "Payments and fees" },
    { id: "refunds", title: "Refunds and cancellations" },
    { id: "tickets", title: "Tickets and entry" },
    { id: "acceptable-use", title: "Acceptable use" },
    { id: "content", title: "Your content" },
    { id: "disclaimers", title: "Disclaimers" },
    { id: "liability", title: "Limitation of liability" },
    { id: "indemnity", title: "Indemnity" },
    { id: "suspension", title: "Suspension and ending the pilot" },
    { id: "force-majeure", title: "Events outside our control" },
    { id: "changes", title: "Changes to these terms" },
    { id: "law", title: "Governing law and disputes" },
    { id: "general", title: "General" },
    { id: "contact", title: "Contact" },
  ];

  const n = (/** @type {string} */ id) => sections.findIndex((s) => s.id === id) + 1;
</script>

<LegalPage
  title="Terms of Service"
  {sections}
  related={{ href: "/privacy", label: "Privacy Policy" }}
>
  <p class="m-0 text-sm leading-6 text-ink-body">
    These terms are an agreement between you and {LEGAL.operatorName} ("we", "us"), who runs SOS SEATS.
    By creating an account, buying or claiming a ticket, or publishing an event, you accept them.
  </p>

  <LegalSection id="about" number={n("about")} title="About SOS SEATS and its test status">
    <p>
      SOS SEATS is a personal, non-commercial pilot run by {LEGAL.operatorName}. It is not a registered
      company. It is provided "as is" and "as available". It may change, have bugs or lose data, and
      it may end at any time.
    </p>
  </LegalSection>

  <LegalSection id="eligibility" number={n("eligibility")} title="Eligibility and accounts">
    <ul>
      <li>You must be {LEGAL.minAge} or older to use SOS SEATS.</li>
      <li>You must give accurate information and keep your login details private.</li>
      <li>Organisers are responsible for the door staff accounts they create and for how those accounts are used.</li>
    </ul>
  </LegalSection>

  <LegalSection id="what-we-are" number={n("what-we-are")} title="What SOS SEATS is (and is not)">
    <p>
      SOS SEATS is only a technology tool that helps organisers list events and sell or give away
      tickets. Each ticket is a contract between the attendee and the event organiser. SOS SEATS is not
      the organiser, seller, venue or insurer of any event.
    </p>
  </LegalSection>

  <LegalSection id="organisers" number={n("organisers")} title="Organiser duties">
    <p>If you publish an event, you agree to:</p>
    <ul>
      <li>run the event as listed;</li>
      <li>get any permits you need and keep the venue safe;</li>
      <li>follow the law, including paying any taxes on your ticket sales;</li>
      <li>handle customer support, refunds and cancellations for your event;</li>
      <li>take responsibility for how your door staff behave;</li>
      <li>
        act as the independent controller of any guest and staff data you enter, including telling
        those people their data is on SOS SEATS, as data protection law (GDPR Article 14) requires;
      </li>
      <li>
        not enter sensitive data (for example about health or religion) without the person's explicit
        agreement.
      </li>
    </ul>
  </LegalSection>

  <LegalSection id="payments" number={n("payments")} title="Payments and fees">
    <ul>
      <li>Ticket prices are set by the organiser.</li>
      <li>
        Payments are processed by Monime and the mobile money operators (Orange Money, Afrimoney). Their
        own terms also apply.
      </li>
      <li>
        <strong>Collection agent.</strong> SOS SEATS collects ticket payments only as a limited payment
        collection agent for the organiser. Once we receive a buyer's payment, the buyer has paid the
        organiser in full. The ticket money (minus fees) belongs to the organiser, and we hold it on the
        organiser's behalf only until they withdraw it. SOS SEATS is not a bank and does not take
        deposits: balances are not savings, earn no interest, and are not used for any other purpose.
        Our own income is only the booking fee and the platform fee.
      </li>
      <li>
        <strong>Fees.</strong> Buyers pay a booking fee of {bookingFee} on paid tickets. Organisers pay a
        platform fee of {platformFee} on each paid ticket sale, taken when the sale is made. When they
        withdraw, the mobile money transfer fee (currently {providerFee}) is taken from the amount
        withdrawn. The booking fee is non-refundable, except where the law requires otherwise.
      </li>
      <li>
        <strong>Prompt payout.</strong> Ticket money becomes available to withdraw 24 hours after the
        event starts. Organisers
        agree to withdraw within {LEGAL.payoutWindowDays} days of their event ending. We may remind you
        and contact you to arrange the payout. If we can't reach you after reasonable attempts, the
        rule in <a href="#refunds">section {n("refunds")}</a> may apply to the unclaimed balance.
      </li>
      <li>
        Withdrawals can be delayed or held for review, and earn no interest. You must enter the correct
        payout number. We are not responsible for money sent to a wrong number you entered.
      </li>
      <li>
        If a payment is reversed, charged back or found to be fraudulent, the organiser owes that amount,
        and we may deduct it from the organiser's balance.
      </li>
      <li>Fees can change. A change applies only to events published after we give notice of it.</li>
    </ul>
  </LegalSection>

  <LegalSection id="refunds" number={n("refunds")} title="Refunds and cancellations">
    <ul>
      <li>SOS SEATS does not issue refunds and is not responsible for them.</li>
      <li>Send refund requests to the event organiser.</li>
      <li>Cancelled, postponed or changed events are the organiser's responsibility.</li>
      <li>
        If an event is cancelled, the organiser can't be reached, or we suspect fraud, we may freeze that
        event's balance and return the held money to buyers. This is a right, not an obligation, and
        organisers authorise it by using SOS SEATS.
      </li>
      <li>Otherwise we may help at our discretion, but we have no obligation to.</li>
      <li>Failed or duplicate payments are first handled through your mobile money provider.</li>
    </ul>
  </LegalSection>

  <LegalSection id="tickets" number={n("tickets")} title="Tickets and entry">
    <ul>
      <li>The QR code is your ticket. Do not copy it or resell it outside SOS SEATS.</li>
      <li>Ticket transfers follow the rules shown in the app. A transferred ticket gets a new QR code.</li>
      <li>The organiser can refuse entry.</li>
      <li>If you lose access because you shared your password or ticket, that is your responsibility.</li>
    </ul>
  </LegalSection>

  <LegalSection id="acceptable-use" number={n("acceptable-use")} title="Acceptable use">
    <p>You must not:</p>
    <ul>
      <li>list illegal, fraudulent or fake events, or post hateful content;</li>
      <li>scrape the site, or test its security without our written permission;</li>
      <li>use SOS SEATS for money laundering or any other financial crime.</li>
    </ul>
  </LegalSection>

  <LegalSection id="content" number={n("content")} title="Your content">
    <p>
      When you upload event images or details, you give us a licence to show them on SOS SEATS for as
      long as the event is listed. You confirm you have the rights to everything you upload.
    </p>
  </LegalSection>

  <LegalSection id="disclaimers" number={n("disclaimers")} title="Disclaimers">
    <p>
      As far as the law allows, SOS SEATS is provided without warranties of any kind, including that it
      will be available, error-free or fit for a particular purpose.
    </p>
  </LegalSection>

  <LegalSection id="liability" number={n("liability")} title="Limitation of liability">
    <ul>
      <li>
        We are not liable for indirect or consequential loss, for the quality of any event, or for
        anything an organiser does or fails to do.
      </li>
      <li>
        Our total liability to you is limited to the booking fees you paid us in the 12 months before
        the claim.
      </li>
      <li>
        Nothing in these terms excludes liability that cannot legally be excluded, such as for fraud,
        death or personal injury caused by negligence, or your mandatory consumer rights.
      </li>
    </ul>
  </LegalSection>

  <LegalSection id="indemnity" number={n("indemnity")} title="Indemnity">
    <p>
      Organisers and users agree to cover claims made against us that arise from their events or from
      their misuse of SOS SEATS.
    </p>
  </LegalSection>

  <LegalSection id="suspension" number={n("suspension")} title="Suspension and ending the pilot">
    <p>
      We may suspend or close accounts that break these terms. If the pilot ends, organisers get at
      least 14 days' notice to withdraw their balances.
    </p>
  </LegalSection>

  <LegalSection id="force-majeure" number={n("force-majeure")} title="Events outside our control">
    <p>
      We are not liable for delays or failures caused by things outside our reasonable control, such as
      outages of mobile money networks, Monime, Supabase or our hosting provider, power or internet
      failures, or government action.
    </p>
  </LegalSection>

  <LegalSection id="changes" number={n("changes")} title="Changes to these terms">
    <p>
      We will announce material changes on the site, and email organisers who have a balance. If you
      keep using SOS SEATS after a change, you accept the new terms.
    </p>
  </LegalSection>

  <LegalSection id="law" number={n("law")} title="Governing law and disputes">
    <ul>
      <li>Please raise any dispute with us by email first, and give us 30 days to resolve it informally.</li>
      <li>The law of {LEGAL.governingLaw} applies, and the courts of {LEGAL.governingLaw} decide disputes.</li>
      <li>If you are a consumer in the EU or UK, you keep the mandatory rights your local law gives you.</li>
    </ul>
  </LegalSection>

  <LegalSection id="general" number={n("general")} title="General">
    <ul>
      <li>If any part of these terms is invalid, the rest still applies.</li>
      <li>If we don't enforce a term straight away, we have not waived it.</li>
      <li>These terms and the <a href="/privacy">Privacy Policy</a> are the whole agreement between us.</li>
      <li>You can't transfer your account or your rights under these terms to someone else.</li>
    </ul>
  </LegalSection>

  <LegalSection id="contact" number={n("contact")} title="Contact">
    <p>
      Questions about these terms: <a href="mailto:{LEGAL.contactEmail}">{LEGAL.contactEmail}</a>.
    </p>
  </LegalSection>
</LegalPage>

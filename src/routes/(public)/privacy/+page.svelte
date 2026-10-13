<script>
  import LegalPage from "$lib/components/legal/LegalPage.svelte";
  import LegalSection from "$lib/components/legal/LegalSection.svelte";
  import { LEGAL } from "$lib/legal/legalConfig.js";

  const sections = [
    { id: "who-we-are", title: "Who we are" },
    { id: "data", title: "Data we collect" },
    { id: "purposes", title: "Why we use it (lawful bases)" },
    { id: "sharing", title: "Who we share it with" },
    { id: "organisers", title: "Organisers as independent controllers" },
    { id: "transfers", title: "International transfers" },
    { id: "retention", title: "How long we keep it" },
    { id: "security", title: "Security and breaches" },
    { id: "required", title: "Required data and automated decisions" },
    { id: "rights", title: "Your rights" },
    { id: "cookies", title: "Cookies and browser storage" },
    { id: "blockchain", title: "Blockchain" },
    { id: "children", title: "Children" },
    { id: "changes", title: "Changes and contact" },
  ];

  const n = (/** @type {string} */ id) => sections.findIndex((s) => s.id === id) + 1;

  const storage = [
    {
      name: "userSession",
      type: "Cookie (httpOnly, signed)",
      purpose: "Keeps you signed in.",
      lasts: "Up to 7 days, or until you sign out",
    },
    {
      name: "eventCreationData, eventEditData",
      type: "localStorage",
      purpose: "Saves your event draft while you create or edit an event.",
      lasts: "Until the event is saved or you clear your browser data",
    },
    {
      name: "Checkout, claim and publish state",
      type: "sessionStorage",
      purpose:
        "Remembers your selected tickets, checkout progress (including the payment phone number) and publish status.",
      lasts: "Until you close the tab",
    },
  ];
</script>

<LegalPage
  title="Privacy Policy"
  {sections}
  related={{ href: "/terms", label: "Terms of Service" }}
>
  <p class="m-0 text-sm leading-6 text-ink-body">
    This policy explains what personal data SOS SEATS collects, why, and the rights you have. It is
    written to meet the EU and UK General Data Protection Regulation (GDPR) and applicable local law.
  </p>

  <LegalSection id="who-we-are" number={n("who-we-are")} title="Who we are">
    <p>
      SOS SEATS is a personal, non-commercial test project run by {LEGAL.operatorName}, who is the data
      controller for the data described here. Contact:
      <a href="mailto:{LEGAL.contactEmail}">{LEGAL.contactEmail}</a>.
    </p>
  </LegalSection>

  <LegalSection id="data" number={n("data")} title="Data we collect">
    <ul>
      <li>
        <strong>Attendees:</strong> your email or phone number, username, tickets, orders, the mobile
        money number you pay with, and ticket transfers.
      </li>
      <li>
        <strong>Organisers:</strong> the above, plus your events, event images, and the mobile money
        numbers you withdraw to (with the withdrawal amounts and fees).
      </li>
      <li><strong>Door staff:</strong> login contact details and the tickets they scan.</li>
      <li>
        <strong>Guests added by organisers:</strong> the name and contact details the organiser enters.
      </li>
      <li>
        <strong>Wallet address:</strong> only if you linked a Solana wallet in the past. Wallet sign-in is
        currently switched off.
      </li>
      <li>
        <strong>Public information:</strong> event listings, including the organiser's name and event
        images, are visible to anyone.
      </li>
      <li>
        <strong>Transfers:</strong> when a ticket is transferred, the sender and recipient see each
        other's username.
      </li>
      <li>
        <strong>Technical logs:</strong> our hosting provider ({LEGAL.hostingProvider}) and Supabase record
        IP addresses, device and browser details, and sign-in events in their security logs. SOS SEATS
        does not store these itself.
      </li>
    </ul>
    <p>We do not use analytics, ad tracking or profiling.</p>
  </LegalSection>

  <LegalSection id="purposes" number={n("purposes")} title="Why we use it (lawful bases)">
    <ul>
      <li>
        <strong>Contract</strong> (GDPR Article 6(1)(b)): running your account, tickets, payments, payouts
        and ticket scanning.
      </li>
      <li>
        <strong>Legitimate interests</strong> (Article 6(1)(f)): keeping the service secure, preventing
        fraud and stopping ticket misuse.
      </li>
      <li><strong>Legal obligation</strong> (Article 6(1)(c)): where the law requires us to keep or share data.</li>
      <li><strong>Consent</strong> (Article 6(1)(a)): where we ask for it. You can withdraw it at any time.</li>
    </ul>
  </LegalSection>

  <LegalSection id="sharing" number={n("sharing")} title="Who we share it with">
    <ul>
      <li>
        <strong>The organiser of each event you attend:</strong> your name or username, ticket and
        check-in details.
      </li>
      <li><strong>That event's door staff:</strong> the result of scanning your ticket.</li>
      <li>
        <strong>Our service providers (processors):</strong> Supabase (database and login) and
        {LEGAL.hostingProvider} (website hosting).
      </li>
      <li>
        <strong>Payment providers:</strong> Monime and the mobile money operators process payments for us.
        They are also independent controllers for their own legal duties, such as anti-money-laundering
        checks, under their own privacy policies.
      </li>
      <li><strong>The Solana network:</strong> nothing is sent while wallet features are off.</li>
      <li><strong>Social sites:</strong> only when you click a share link.</li>
      <li><strong>Authorities:</strong> if the law requires it.</li>
    </ul>
    <p>We never sell your data and we don't use it for advertising.</p>
  </LegalSection>

  <LegalSection id="organisers" number={n("organisers")} title="Organisers as independent controllers">
    <p>
      Organisers are independent controllers for their guest lists, their staff contacts and any data
      they collect themselves. Sensitive data (GDPR Article 9, for example about health or religion)
      may only be added with the guest's explicit consent, and the organiser is responsible for getting
      it.
    </p>
  </LegalSection>

  <LegalSection id="transfers" number={n("transfers")} title="International transfers">
    <p>
      Our database is hosted by Supabase in {LEGAL.hostingRegion}, and {LEGAL.hostingProvider} may serve
      the site from other countries. Where data leaves the EU or UK, both providers use Standard
      Contractual Clauses where they apply.
    </p>
  </LegalSection>

  <LegalSection id="retention" number={n("retention")} title="How long we keep it">
    <ul>
      <li>
        <strong>Account data:</strong> while your account is active. If you ask us to delete it, we do
        so within {LEGAL.requestResponseDays} days.
      </li>
      <li>
        <strong>Order, payment and payout records:</strong> {LEGAL.orderRecordsMonths} months after the
        event, for disputes and accounting.
      </li>
      <li>
        <strong>Revoked door staff:</strong> deactivated straight away, and deleted with the event's
        records.
      </li>
      <li>
        <strong>Login cookie:</strong> up to 7 days. sessionStorage clears when you close the tab.
      </li>
      <li><strong>Security logs:</strong> as long as each provider keeps them, usually days to weeks.</li>
      <li>
        <strong>When the pilot ends:</strong> everything is deleted within {LEGAL.pilotDataDeletionDays}
        days, except anything the law requires us to keep.
      </li>
    </ul>
  </LegalSection>

  <LegalSection id="security" number={n("security")} title="Security and breaches">
    <p>
      We take reasonable measures to protect your data, including hashed passwords, signed httpOnly
      login cookies, server-side checks on payments and withdrawals, and database access limited to our
      server. No system is perfectly secure, and this is a test project. If a breach affects you, we
      will tell you and the authorities where the law requires.
    </p>
  </LegalSection>

  <LegalSection id="required" number={n("required")} title="Required data and automated decisions">
    <p>
      You need a contact (phone number or email) and a username to use SOS SEATS. Without them you can't
      buy, claim or scan tickets. We make no automated decisions about you and do no profiling.
    </p>
  </LegalSection>

  <LegalSection id="rights" number={n("rights")} title="Your rights">
    <p>Under the GDPR, the UK GDPR and any applicable local law, you have the right to:</p>
    <ul>
      <li>access the data we hold about you;</li>
      <li>correct it;</li>
      <li>have it erased;</li>
      <li>restrict how we use it;</li>
      <li>receive it in a portable format;</li>
      <li>object to how we use it;</li>
      <li>withdraw consent at any time, where we rely on consent.</li>
    </ul>
    <p>
      SOS SEATS doesn't have in-app account deletion or data export yet, so email
      <a href="mailto:{LEGAL.contactEmail}">{LEGAL.contactEmail}</a>. We answer within
      {LEGAL.requestResponseDays} days after verifying your identity. You can also complain to your data
      protection authority.
    </p>
  </LegalSection>

  <LegalSection id="cookies" number={n("cookies")} title="Cookies and browser storage">
    <p>
      SOS SEATS only uses storage that is strictly necessary for the service to work. There are no
      tracking, analytics or third-party cookies, so no cookie banner is needed.
    </p>
    <div class="mb-3 overflow-x-auto rounded-xl border border-paper-border">
      <table class="w-full min-w-[520px] border-collapse text-left text-[13px] leading-5">
        <thead class="bg-paper-cream text-ink">
          <tr>
            <th class="px-3 py-2 font-bold">Name</th>
            <th class="px-3 py-2 font-bold">Type</th>
            <th class="px-3 py-2 font-bold">Purpose</th>
            <th class="px-3 py-2 font-bold">How long</th>
          </tr>
        </thead>
        <tbody>
          {#each storage as row}
            <tr class="border-t border-paper-border align-top">
              <td class="px-3 py-2 font-mono text-xs text-ink">{row.name}</td>
              <td class="px-3 py-2">{row.type}</td>
              <td class="px-3 py-2">{row.purpose}</td>
              <td class="px-3 py-2">{row.lasts}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </LegalSection>

  <LegalSection id="blockchain" number={n("blockchain")} title="Blockchain">
    <p>
      Wallet features are switched off. If you used them in the past, any records on the Solana
      blockchain are public and permanent, and we cannot erase them.
    </p>
  </LegalSection>

  <LegalSection id="children" number={n("children")} title="Children">
    <p>
      SOS SEATS is not for anyone under {LEGAL.minAge}. If we find that data belongs to someone under
      {LEGAL.minAge}, we delete it.
    </p>
  </LegalSection>

  <LegalSection id="changes" number={n("changes")} title="Changes and contact">
    <p>
      We will post any changes to this policy on this page and update the effective date. For material
      changes, we will also tell you on the site. Questions or requests:
      <a href="mailto:{LEGAL.contactEmail}">{LEGAL.contactEmail}</a>.
    </p>
  </LegalSection>
</LegalPage>

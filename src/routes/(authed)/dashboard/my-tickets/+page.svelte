<script>
  // @ts-nocheck
  /**
   * My Tickets — desktop HI-FI 604:1490 / past 605:1341 (roadmap 6.1 / FR-19–20).
   * Transfer behavior = 6.2 (toast only). QR payload locked for scanner 7.1.
   */
  import { showToast } from "$lib/store";
  import MyTicketsLayout from "$lib/components/attendee/MyTicketsLayout.svelte";
  import MyTicketsRevealOverlay from "$lib/components/attendee/MyTicketsRevealOverlay.svelte";

  export let data;

  let tab = "upcoming";
  let overlayOpen = false;
  /** @type {any} */
  let overlayEvent = null;
  /** @type {any} */
  let overlayGuest = null;
  /** @type {any} */
  let RevealOverlayRef = null;

  $: userName = data?.userName || "Attendee";
  $: highlight = data?.highlight || null;
  $: pastHighlight = data?.pastHighlight || null;
  $: stats = data?.stats || { upcoming: 0, past: 0, transfer: 0 };
  $: upcoming = data?.upcoming || [];
  $: past = data?.past || [];

  function toOverlayProps(ticket) {
    return {
      event: {
        title: ticket.eventName,
        rawDate: ticket.eventDate,
        date: ticket.dateLabel,
        time: ticket.eventTime,
        location: ticket.eventLocation,
        image: ticket.eventImage,
        ticketDesignConfig: ticket.ticketDesignConfig,
      },
      guest: {
        name: ticket.guestName,
        ticketType: ticket.ticketTypeName,
        ticketNumber: ticket.qrPayload,
        id: ticket.guestId || ticket.id,
      },
    };
  }

  function openQr(ticket) {
    if (!ticket || ticket.status !== "VALID") return;
    const props = toOverlayProps(ticket);
    overlayEvent = props.event;
    overlayGuest = props.guest;
    overlayOpen = true;
  }

  /** Souvenir view for past tickets (View Ticket / View Details). */
  function openViewTicket(ticket) {
    if (!ticket) return;
    const props = toOverlayProps(ticket);
    overlayEvent = props.event;
    overlayGuest = props.guest;
    overlayOpen = true;
  }

  async function downloadTicket(ticket) {
    if (!ticket || ticket.status !== "VALID") return;
    const props = toOverlayProps(ticket);
    overlayEvent = props.event;
    overlayGuest = props.guest;
    overlayOpen = true;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 50));
      if (RevealOverlayRef?.download) {
        await RevealOverlayRef.download();
        return;
      }
    }
  }

  function transferTicket() {
      showToast(
      "info",
      "Transfer coming soon",
      "Ticket transfer lands in the next release (roadmap 6.2)."
    );
  }

  function feedbackReview() {
    showToast(
      "info",
      "Feedback coming soon",
      "Event feedback and reviews are not available yet."
    );
  }

  function addToCalendar(ticket) {
    if (!ticket) return;
    const start = ticket.eventDate
      ? new Date(ticket.eventDate)
      : new Date();
    if (ticket.eventTime) {
      const [h, m] = String(ticket.eventTime).split(":");
      if (Number.isFinite(Number(h))) {
        start.setHours(Number(h), Number.isFinite(Number(m)) ? Number(m) : 0, 0, 0);
      }
    }
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

    function icsStamp(d) {
      return d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    }

    const uid = `${ticket.id}@sosseats`;
    const summary = (ticket.eventName || "Event").replace(/[,;\\]/g, " ");
    const location = (ticket.eventLocation || "").replace(/[,;\\]/g, " ");
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SOS SEATS//My Tickets//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.replace(/\s+/g, "-").toLowerCase() || "event"}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>My Tickets | SOS SEATS</title>
</svelte:head>

<MyTicketsLayout
  {userName}
  {highlight}
  {pastHighlight}
  {stats}
  {upcoming}
  {past}
  {tab}
  onTabChange={(next) => (tab = next)}
  onShowQr={openQr}
  onAddToCalendar={addToCalendar}
  onTransfer={transferTicket}
  onDownload={downloadTicket}
  onViewTicket={openViewTicket}
  onFeedback={feedbackReview}
  onViewDetails={openViewTicket}
/>

<MyTicketsRevealOverlay
  bind:this={RevealOverlayRef}
  bind:open={overlayOpen}
  event={overlayEvent}
  guest={overlayGuest}
/>

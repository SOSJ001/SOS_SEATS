import { error } from "@sveltejs/kit";
import { dev } from "$app/environment";

const sampleEvent = {
  eventName: "Freetown Comedy Festival",
  eventImage: null,
  tierBadge: "VIP TIER",
  ticketTypeName: "VIP Tier",
  venue: "Family Kingdom",
  eventDateLabel: "April 12, 2026 · 18:00",
  dateMonth: "APR",
  dateDay: "12",
};

/**
 * Dev-only preview with sample data of Transfer Successful (527:343) and Transfer Failed
 * (527:546, `?status=failed`), HI-FI desktop.
 * Real receipts load from a transfer record at receipt/[transferId] with roadmap 6.2b.
 */
export function load({ url }) {
  if (!dev) {
    throw error(404, "Not found");
  }

  if (url.searchParams.get("status") === "failed") {
    return {
      status: "failed",
      receipt: {
        ...sampleEvent,
        recipientUsername: "aminata_s",
        failureReason: "Username not found",
        reference: "#TRF-2026-0087",
      },
    };
  }

  return {
    status: "success",
    receipt: {
      ...sampleEvent,
      recipientUsername: "aminata_s",
      transferredAtLabel: "April 12, 2026 · 14:45",
      reference: "#TRF-2026-0087",
    },
  };
}

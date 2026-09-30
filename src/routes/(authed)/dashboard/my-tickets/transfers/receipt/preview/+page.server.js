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
 * Real receipts load from ticket_transfers at receipt/[transferId] (6.2b).
 * A failed transfer writes no row, so the failed state carries no reference.
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
        failureReason: "No SOS SEATS account with that username",
      },
    };
  }

  return {
    status: "success",
    receipt: {
      ...sampleEvent,
      recipientUsername: "aminata_s",
      transferredAtLabel: "April 12, 2026 · 14:45",
      reference: "TRF-3F9A1C2B",
    },
  };
}

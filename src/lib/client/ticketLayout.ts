/**
 * HI-FI ticket layout config for create-event Step 3 (55:1282).
 * Nested under ticket_design_config.layout; legacy canvas fields stay intact.
 */

import {
  defaultTicketDesignConfig,
  type TicketDesignConfig,
} from "$lib/store";

export const ACCENT_COLOURS = [
  "#ff5a1f",
  "#4080FF",
  "#00BD8E",
  "#8A5CFF",
  "#F04C9B",
] as const;

export type QrPlacement = "left" | "centre" | "right";
export type LayoutFontFamily = "plusJakarta" | "inter" | "roboto";
export type BackgroundPattern = "none" | "subtleGrid" | "diagonal";

export type TicketLayout = {
  accentColour: string;
  brandingLabel: string;
  qrPlacement: QrPlacement;
  fontFamily: LayoutFontFamily;
  backgroundPattern: BackgroundPattern;
  includeDateTime: boolean;
  includeVenue: boolean;
  showDisclaimer: boolean;
};

export const defaultTicketLayout: TicketLayout = {
  accentColour: "#ff5a1f",
  brandingLabel: "",
  qrPlacement: "centre",
  fontFamily: "plusJakarta",
  backgroundPattern: "diagonal",
  includeDateTime: true,
  includeVenue: true,
  showDisclaimer: true,
};

export const FONT_FAMILY_CSS: Record<LayoutFontFamily, string> = {
  plusJakarta: '"Plus Jakarta Sans", system-ui, sans-serif',
  inter: "Inter, system-ui, sans-serif",
  roboto: "Roboto, Arial, sans-serif",
};

function qrXFromPlacement(
  placement: QrPlacement,
): "left" | "center" | "right" {
  if (placement === "centre") return "center";
  return placement;
}

/** Merge layout onto a full ticket_design_config; sync qrCode.position.x. */
export function applyLayoutToDesignConfig(
  base: TicketDesignConfig | Record<string, unknown> | null | undefined,
  layout: TicketLayout,
): TicketDesignConfig & { layout: TicketLayout } {
  const merged = {
    ...defaultTicketDesignConfig,
    ...(base || {}),
    qrCode: {
      ...defaultTicketDesignConfig.qrCode,
      ...((base as TicketDesignConfig)?.qrCode || {}),
      position: {
        ...defaultTicketDesignConfig.qrCode.position,
        ...((base as TicketDesignConfig)?.qrCode?.position || {}),
        x: qrXFromPlacement(layout.qrPlacement),
      },
    },
    layout: { ...defaultTicketLayout, ...layout },
  };
  return merged as TicketDesignConfig & { layout: TicketLayout };
}

/** Ensure ticket_design_config has a complete layout without wiping legacy fields. */
export function ensureTicketDesignWithLayout(
  existing: TicketDesignConfig | Record<string, unknown> | null | undefined,
): TicketDesignConfig & { layout: TicketLayout } {
  const layout = {
    ...defaultTicketLayout,
    ...((existing as { layout?: Partial<TicketLayout> })?.layout || {}),
  };
  return applyLayoutToDesignConfig(existing, layout);
}

export function formatTicketDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (timeStr) return `${formatted} · ${timeStr}`;
    return formatted;
  } catch {
    return dateStr;
  }
}

export function ticketTypeBadge(ticketTypes: Array<{ name?: string }> | undefined): string {
  const named = ticketTypes?.find((t) => t.name?.trim());
  if (named?.name?.trim()) {
    return `${named.name.trim().toUpperCase()} TICKET`;
  }
  return "VIP TICKET";
}

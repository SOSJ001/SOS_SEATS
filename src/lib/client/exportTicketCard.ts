/**
 * Canvas export of HI-FI TicketLivePreview (420px) — avoids html2canvas font-baseline bugs.
 */
import { generateQrImage } from "$lib/store";
import {
  FONT_FAMILY_CSS,
  formatTicketDate,
  ticketTypeBadge,
  type TicketLayout,
} from "$lib/client/ticketLayout";

export type ExportTicketCardOptions = {
  layout: Partial<TicketLayout> & Record<string, any>;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  ticketTypes?: Array<{ name?: string }>;
  ticketNumber?: string;
  qrData?: string;
  /** Output scale (device pixels). Default 2. */
  scale?: number;
};

const WIDTH = 420;
const BARCODE_WIDTHS = [
  2, 1, 3, 1, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1,
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawMapPin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  // Simple pin silhouette
  ctx.moveTo(s / 2, s);
  ctx.bezierCurveTo(s * 0.15, s * 0.55, 0, s * 0.35, 0, s * 0.32);
  ctx.arc(s / 2, s * 0.32, s * 0.32, Math.PI, 0, false);
  ctx.bezierCurveTo(s, s * 0.35, s * 0.85, s * 0.55, s / 2, s);
  ctx.fill();
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(s / 2, s * 0.32, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCalendar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  roundRect(ctx, 0.5, size * 0.15, size - 1, size * 0.75, 1.5);
  ctx.stroke();
  ctx.fillRect(0.5, size * 0.15, size - 1, size * 0.22);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(size * 0.28, 0);
  ctx.lineTo(size * 0.28, size * 0.28);
  ctx.moveTo(size * 0.72, 0);
  ctx.lineTo(size * 0.72, size * 0.28);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the HI-FI ticket card to a PNG data URL.
 */
export async function exportTicketCardPng(
  options: ExportTicketCardOptions
): Promise<string> {
  const layout = options.layout || {};
  const accent = layout.accentColour || "#ff5a1f";
  const fontCss =
    FONT_FAMILY_CSS[layout.fontFamily as keyof typeof FONT_FAMILY_CSS] ||
    FONT_FAMILY_CSS.plusJakarta;
  const branding =
    layout.brandingLabel?.trim() ||
    options.eventName?.trim() ||
    "Event name";
  const badge = ticketTypeBadge(options.ticketTypes);
  const dateLabel = formatTicketDate(
    options.eventDate || "",
    options.eventTime
  );
  const venue = options.eventLocation || "";
  const ticketNo = options.ticketNumber?.startsWith("#")
    ? options.ticketNumber
    : `#${options.ticketNumber || "SOS-2026-0042"}`;
  const isSide =
    layout.qrPlacement === "left" || layout.qrPlacement === "right";
  const isRight = layout.qrPlacement === "right";
  const showDisclaimer = layout.showDisclaimer !== false;
  const includeVenue = layout.includeVenue !== false && !!venue;
  const includeDate = layout.includeDateTime !== false && !!dateLabel;

  const scale = options.scale || 2;
  // Content-driven height (side denser)
  const height = isSide
    ? showDisclaimer
      ? 232
      : 210
    : showDisclaimer
      ? 300
      : 278;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.scale(scale, scale);

  // Clip to rounded card
  roundRect(ctx, 0, 0, WIDTH, height, 16);
  ctx.clip();

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, WIDTH, 0);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(0.5, "#16213e");
  grad.addColorStop(1, "#0f3460");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, height);

  // Diagonal hatch
  if (layout.backgroundPattern === "diagonal") {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    for (let i = -height; i < WIDTH + height; i += 19) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Orange top stripe
  const stripe = ctx.createLinearGradient(0, 0, WIDTH, 0);
  stripe.addColorStop(0, accent);
  stripe.addColorStop(0.5, "#ff8c42");
  stripe.addColorStop(1, accent);
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, WIDTH, 4);

  // Border
  ctx.strokeStyle = "#e8e3dd";
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, WIDTH - 1, height - 1, 16);
  ctx.stroke();

  const padX = isSide ? 20 : 24;
  let y = isSide ? 20 : 24; // below stripe + padding

  // Header: brand + badge
  ctx.fillStyle = accent;
  roundRect(ctx, padX, y, 3, 22, 1);
  ctx.fill();

  ctx.font = `800 18px ${fontCss}`;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("SOS SEATS", padX + 11, y + 11);

  // Badge
  ctx.font = `700 9px ${fontCss}`;
  const badgeW = Math.ceil(ctx.measureText(badge).width) + 20;
  const badgeX = WIDTH - padX - badgeW;
  ctx.fillStyle = accent;
  roundRect(ctx, badgeX, y, badgeW, 22, 11);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, badgeX + badgeW / 2, y + 11);
  ctx.textAlign = "left";

  y += 22 + (isSide ? 12 : 16);

  // QR
  let qrImg: HTMLImageElement | null = null;
  if (options.qrData) {
    try {
      const url = await generateQrImage(String(options.qrData));
      qrImg = await loadImage(url);
    } catch {
      qrImg = null;
    }
  }

  const qrBox = 72;
  const qrInner = 60;

  if (isSide) {
    const qrX = isRight ? WIDTH - padX - qrBox : padX;
    const detailsX = isRight ? padX : padX + qrBox + 16;
    const detailsW = WIDTH - padX * 2 - qrBox - 16;

    // QR white box
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#e8e3dd";
    roundRect(ctx, qrX, y, qrBox, qrBox, 8);
    ctx.fill();
    ctx.stroke();
    if (qrImg) {
      ctx.drawImage(
        qrImg,
        qrX + (qrBox - qrInner) / 2,
        y + (qrBox - qrInner) / 2,
        qrInner,
        qrInner
      );
    }

    let dy = y;
    ctx.font = `800 15px ${fontCss}`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";
    // Truncate event name if needed
    let title = branding;
    while (ctx.measureText(title).width > detailsW && title.length > 3) {
      title = title.slice(0, -2) + "…";
    }
    ctx.fillText(title, detailsX, dy);
    dy += 20;

    if (includeVenue) {
      drawMapPin(ctx, detailsX, dy + 1, 10, accent);
      ctx.font = `500 10px ${fontCss}`;
      ctx.fillStyle = "#9ca3a8";
      ctx.textBaseline = "middle";
      ctx.fillText(venue, detailsX + 14, dy + 6);
      dy += 16;
    }
    if (includeDate) {
      drawCalendar(ctx, detailsX, dy + 1, 10, accent);
      ctx.font = `500 10px ${fontCss}`;
      ctx.fillStyle = "#9ca3a8";
      ctx.textBaseline = "middle";
      ctx.fillText(dateLabel, detailsX + 14, dy + 6);
    }

    y += qrBox + 16;
  } else {
    // Centre layout
    const qrX = (WIDTH - qrBox) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#e8e3dd";
    roundRect(ctx, qrX, y, qrBox, qrBox, 8);
    ctx.fill();
    ctx.stroke();
    if (qrImg) {
      ctx.drawImage(
        qrImg,
        qrX + (qrBox - qrInner) / 2,
        y + (qrBox - qrInner) / 2,
        qrInner,
        qrInner
      );
    }
    y += qrBox + 12;

    ctx.font = `800 20px ${fontCss}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(branding, WIDTH / 2, y);
    y += 28;

    if (includeVenue) {
      const tw = ctx.measureText
        ? (() => {
            ctx.font = `500 11px ${fontCss}`;
            return ctx.measureText(venue).width;
          })()
        : 100;
      const rowW = 10 + 6 + tw;
      const startX = (WIDTH - rowW) / 2;
      drawMapPin(ctx, startX, y, 10, accent);
      ctx.font = `500 11px ${fontCss}`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(venue, startX + 14, y + 5);
      y += 18;
    }
    if (includeDate) {
      ctx.font = `500 11px ${fontCss}`;
      const tw = ctx.measureText(dateLabel).width;
      const rowW = 10 + 6 + tw;
      const startX = (WIDTH - rowW) / 2;
      drawCalendar(ctx, startX, y, 10, accent);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(dateLabel, startX + 14, y + 5);
      y += 18;
    }
    ctx.textAlign = "left";
    y += 8;
  }

  // Tear dashed line
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(WIDTH - padX, y);
  ctx.stroke();
  ctx.restore();
  y += isSide ? 10 : 12;

  if (showDisclaimer) {
    ctx.font = `400 ${isSide ? 8 : 9}px ${fontCss}`;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textBaseline = "top";
    ctx.textAlign = isSide ? "left" : "center";
    const disc = "Please arrive 30 minutes early. Valid only for the date/time shown.";
    ctx.fillText(disc, isSide ? padX : WIDTH / 2, y);
    y += isSide ? 18 : 20;
    ctx.textAlign = "left";
  }

  // Footer barcode + ticket no
  const footerY = height - 16 - 28;
  let bx = padX;
  for (const w of BARCODE_WIDTHS) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(bx, footerY, w, 28);
    bx += w + 1;
  }

  ctx.textAlign = "right";
  ctx.font = `500 8px ${fontCss}`;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textBaseline = "bottom";
  ctx.fillText("TICKET NO.", WIDTH - padX, footerY + 12);
  ctx.font = `700 11px ${fontCss}`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.textBaseline = "top";
  ctx.fillText(ticketNo, WIDTH - padX, footerY + 14);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

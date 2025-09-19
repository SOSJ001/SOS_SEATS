import { writable } from "svelte/store";
import { toDataURL } from "qrcode";

// Ticket Design Configuration Types
export interface TicketDesignConfig {
  canvas: {
    width: number;
    height: number;
  };
  qrCode: {
    size: number;
    position: {
      x: "left" | "center" | "right";
      y: "top" | "center" | "bottom";
      offsetX: number;
      offsetY: number;
    };
    shadow: {
      enabled: boolean;
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
    };
  };
  textBox: {
    enabled: boolean;
    position: {
      x: number;
      y: number;
    };
    size: {
      width: number | "auto";
      height: number;
    };
    background: {
      enabled: boolean;
      color: string;
      borderRadius: number;
    };
  };
  colors: {
    primaryName: string;
    eventName: string;
    dateTime: string;
    location: string;
    ticketType: string;
    ticketNumber: string;
    organizer: string;
  };
  fonts: {
    primaryName: FontConfig;
    eventName: FontConfig;
    dateTime: FontConfig;
    location: FontConfig;
    ticketType: FontConfig;
    ticketNumber: FontConfig;
    organizer: FontConfig;
  };
  overlay: {
    enabled: boolean;
    type: "solid" | "gradient";
    gradient?: {
      stops: Array<{
        position: number;
        color: string;
      }>;
    };
    solid?: {
      color: string;
    };
  };
  textShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface FontConfig {
  size: number;
  weight: "normal" | "bold";
}

// Default ticket design configuration
export const defaultTicketDesignConfig: TicketDesignConfig = {
  canvas: {
    width: 400,
    height: 600,
  },
  qrCode: {
    size: 100,
    position: {
      x: "right",
      y: "bottom",
      offsetX: 15,
      offsetY: 15,
    },
    shadow: {
      enabled: true,
      color: "rgba(0, 0, 0, 0.3)",
      blur: 8,
      offsetX: 2,
      offsetY: 2,
    },
  },
  textBox: {
    enabled: true,
    position: {
      x: 15,
      y: 15,
    },
    size: {
      width: "auto",
      height: 200,
    },
    background: {
      enabled: true,
      color: "rgba(0, 0, 0, 0.6)",
      borderRadius: 8,
    },
  },
  colors: {
    primaryName: "#FFD700",
    eventName: "#00F5FF",
    dateTime: "#FFFFFF",
    location: "#9D4EDD",
    ticketType: "#00FF88",
    ticketNumber: "#CCCCCC",
    organizer: "#AAAAAA",
  },
  fonts: {
    primaryName: { size: 26, weight: "bold" },
    eventName: { size: 18, weight: "bold" },
    dateTime: { size: 16, weight: "normal" },
    location: { size: 14, weight: "normal" },
    ticketType: { size: 18, weight: "bold" },
    ticketNumber: { size: 12, weight: "normal" },
    organizer: { size: 12, weight: "normal" },
  },
  overlay: {
    enabled: true,
    type: "gradient",
    gradient: {
      stops: [
        { position: 0, color: "rgba(0, 0, 0, 0.3)" },
        { position: 0.3, color: "rgba(0, 0, 0, 0.1)" },
        { position: 0.7, color: "rgba(0, 0, 0, 0.1)" },
        { position: 1, color: "rgba(0, 0, 0, 0.4)" },
      ],
    },
  },
  textShadow: {
    enabled: true,
    color: "rgba(0, 0, 0, 0.8)",
    blur: 3,
    offsetX: 1,
    offsetY: 1,
  },
};

export const sessionFromDb = writable(null);

// Wallet store
export const walletStore = writable({
  connected: false,
  address: "",
  available: [] as string[],
  error: "",
  selectedWallet: "",
  // Functions will be set by the provider
  connect: null as any,
  connectToSpecific: null as any,
  disconnect: null as any,
  refreshWallets: null as any,
});

// Web3 User store
export const web3UserStore = writable({
  isAuthenticated: false,
  user: null as any,
  isLoading: false,
  error: null as string | null,
  // Functions will be set by the provider
  authenticate: null as any,
  signOut: null as any,
  updateProfile: null as any,
});

// Active section store for navigation highlighting
export const activeSectionStore = writable("home");

export let updatedEventsData = writable([]);

// export function createQrCode(data, image, width, height) {
//   const qrCode = new QRCodeStyling({
//     width: width,
//     height: height,
//     type: "png",
//     data: data,
//     margin: 0,
//     qrOptions: { typeNumber: "0", mode: "Byte", errorCorrectionLevel: "Q" },
//     imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
//     dotsOptions: { type: "dots", color: "#ab9507", gradient: null },
//     backgroundOptions: { color: "#222020" },
//     image: image,
//     dotsOptionsHelper: {
//       colorType: { single: true, gradient: false },
//       gradient: {
//         linear: true,
//         radial: false,
//         color1: "#6a1a4c",
//         color2: "#6a1a4c",
//         rotation: "0",
//       },
//     },
//     cornersSquareOptions: { type: "extra-rounded", color: "#ab9507" },
//     cornersSquareOptionsHelper: {
//       colorType: { single: true, gradient: false },
//       gradient: {
//         linear: true,
//         radial: false,
//         color1: "#000000",
//         color2: "#000000",
//         rotation: "0",
//       },
//     },
//     cornersDotOptions: { type: "", color: "#ab9507" },
//     cornersDotOptionsHelper: {
//       colorType: { single: true, gradient: false },
//       gradient: {
//         linear: true,
//         radial: false,
//         color1: "#000000",
//         color2: "#000000",
//         rotation: "0",
//       },
//     },
//     backgroundOptionsHelper: {
//       colorType: { single: true, gradient: false },
//       gradient: {
//         linear: true,
//         radial: false,
//         color1: "#ffffff",
//         color2: "#ffffff",
//         rotation: "0",
//       },
//     },
//   });
//   return qrCode;
// }

export function generateUniqueFilename() {
  const timestamp = Date.now(); // Get the current timestamp
  const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string
  const uniqueFilename = `${timestamp}_${randomString}`; // Combine timestamp and random string
  return uniqueFilename;
}

// generate qr code and returnthe image
export async function generateQrImage(data: string) {
  const qrImage = toDataURL(data);
  return qrImage;
}

// Convert image URL to data URL to avoid CORS issues
async function convertImageUrlToDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

//get the domain of my site
export function getDomain() {
  try {
    return new URL(window.location.href).hostname;
  } catch (error) {
    return null; // Or handle the error as needed
  }
}

//function to download image
export function downloadImage(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

// Reusable: Share an image data URL using Web Share API with file fallback
export async function shareImageDataUrl(options: {
  dataUrl: string;
  filename?: string;
  title?: string;
  text?: string;
}) {
  const { dataUrl, filename = "image.png", title = "", text = "" } = options;

  // Fetch blob from data URL
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const file = new File([blob], filename, { type: blob.type || "image/png" });

  // Prefer Web Share Level 2 with files
  if (
    (navigator as any).canShare &&
    (navigator as any).canShare({ files: [file] })
  ) {
    await (navigator as any).share({ files: [file], title, text });
    return { method: "web-share-file" } as const;
  }

  // Fallback: basic Web Share with URL
  if ((navigator as any).share) {
    await (navigator as any).share({ title, text, url: dataUrl });
    return { method: "web-share-url" } as const;
  }

  // Fallback: trigger download
  downloadImage(dataUrl, filename);

  // Try clipboard image write
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type || "image/png"]: blob,
      }),
    ]);
    return { method: "clipboard-image" } as const;
  } catch {
    // Last resort: copy data URL as text
    try {
      await navigator.clipboard.writeText(dataUrl);
      return { method: "clipboard-text" } as const;
    } catch {
      return { method: "download-only" } as const;
    }
  }
}

export function generateRandomChars() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }

  return result;
}

// Global toast store
export const toastStore = writable({
  toasts: [] as Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    description: string;
    duration: number;
    show: boolean;
  }>,
});

// Toast actions
export const showToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  description: string,
  duration = 6000
) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

  toastStore.update((state) => ({
    toasts: [
      ...state.toasts,
      {
        id,
        type,
        title,
        description,
        duration,
        show: true,
      },
    ],
  }));

  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
};

export const hideToast = (id: string) => {
  toastStore.update((state) => ({
    toasts: state.toasts.map((toast) =>
      toast.id === id ? { ...toast, show: false } : toast
    ),
  }));

  // Remove from array after animation
  setTimeout(() => {
    removeToast(id);
  }, 300);
};

export const removeToast = (id: string) => {
  toastStore.update((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  }));
};

// Ticket preview generation function
export async function generateTicketPreview(options: {
  eventName: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventImage?: string | File;
  ticketTypeName: string;
  ticketPrice: string | number;
  guestName?: string;
  organizer?: string;
  ticketNumber?: string;
  qrData?: string;
  designConfig?: TicketDesignConfig;
}): Promise<string | null> {
  try {
    // Use provided design config or default
    const config = options.designConfig || defaultTicketDesignConfig;

    // Generate QR code data
    const qrData =
      options.qrData ||
      `${options.eventName}-${options.ticketTypeName}-${Date.now()}`;
    console.log("QR data being used:", qrData);
    const qrCodeDataUrl = await generateQrImage(qrData);

    // Get event image as data URL
    let eventImageDataUrl = null;
    if (options.eventImage) {
      if (typeof options.eventImage === "string") {
        // Check if it's already a data URL
        if (options.eventImage.startsWith("data:")) {
          eventImageDataUrl = options.eventImage;
        } else {
          // Convert external URL to data URL to avoid CORS issues
          try {
            eventImageDataUrl = await convertImageUrlToDataUrl(
              options.eventImage
            );
          } catch (error) {
            console.warn("Failed to convert image URL to data URL:", error);
            // Fallback: use the original URL (might cause CORS issues)
            eventImageDataUrl = options.eventImage;
          }
        }
      } else if (options.eventImage instanceof File) {
        // Convert File to base64
        eventImageDataUrl = await convertFileToBase64(options.eventImage);
      }
    }

    // Create canvas to composite the ticket
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set canvas size (ticket dimensions) from config
    canvas.width = config.canvas.width;
    canvas.height = config.canvas.height;

    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1a1a1a");
    gradient.addColorStop(1, "#2d2d2d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw event image if available
    if (eventImageDataUrl) {
      const eventImg = new Image();
      eventImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        eventImg.onload = resolve;
        eventImg.onerror = reject;
        eventImg.src = eventImageDataUrl;
      });

      // Draw event image as background (scaled to fit)
      const imgAspect = eventImg.width / eventImg.height;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth, drawHeight, drawX, drawY;
      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(eventImg, drawX, drawY, drawWidth, drawHeight);

      // Add overlay for better text readability
      if (config.overlay.enabled) {
        if (config.overlay.type === "gradient" && config.overlay.gradient) {
          const overlayGradient = ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
          );
          config.overlay.gradient.stops.forEach((stop) => {
            overlayGradient.addColorStop(stop.position, stop.color);
          });
          ctx.fillStyle = overlayGradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (config.overlay.type === "solid" && config.overlay.solid) {
          ctx.fillStyle = config.overlay.solid.color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    // Draw QR code with configurable positioning and styling
    const qrImg = new Image();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.src = qrCodeDataUrl;
    });

    const qrSize = config.qrCode.size;

    // Calculate QR code position based on config
    let qrX, qrY;
    switch (config.qrCode.position.x) {
      case "left":
        qrX = config.qrCode.position.offsetX;
        break;
      case "center":
        qrX = (canvas.width - qrSize) / 2 + config.qrCode.position.offsetX;
        break;
      case "right":
        qrX = canvas.width - qrSize - config.qrCode.position.offsetX;
        break;
    }

    switch (config.qrCode.position.y) {
      case "top":
        qrY = config.qrCode.position.offsetY;
        break;
      case "center":
        qrY = (canvas.height - qrSize) / 2 + config.qrCode.position.offsetY;
        break;
      case "bottom":
        qrY = canvas.height - qrSize - config.qrCode.position.offsetY;
        break;
    }

    // Enhanced QR code background with configurable shadow
    if (config.qrCode.shadow.enabled) {
      ctx.shadowColor = config.qrCode.shadow.color;
      ctx.shadowBlur = config.qrCode.shadow.blur;
      ctx.shadowOffsetX = config.qrCode.shadow.offsetX;
      ctx.shadowOffsetY = config.qrCode.shadow.offsetY;
    }
    ctx.fillStyle = "white";
    ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw QR code
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Only draw text and text background if textBox is enabled
    if (config.textBox.enabled) {
      // Create text background for better readability
      const textBgWidth =
        config.textBox.size.width === "auto"
          ? canvas.width - qrSize - 40
          : config.textBox.size.width;
      const textBgHeight = config.textBox.size.height;
      const textBgX = config.textBox.position.x;
      const textBgY = config.textBox.position.y;

      // Semi-transparent background for text area
      if (config.textBox.background.enabled) {
        ctx.fillStyle = config.textBox.background.color;
        if (config.textBox.background.borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(
            textBgX,
            textBgY,
            textBgWidth,
            textBgHeight,
            config.textBox.background.borderRadius
          );
          ctx.fill();
        } else {
          ctx.fillRect(textBgX, textBgY, textBgWidth, textBgHeight);
        }
      }

      // Draw guest name or event name with configurable text shadow
      if (config.textShadow.enabled) {
        ctx.shadowColor = config.textShadow.color;
        ctx.shadowBlur = config.textShadow.blur;
        ctx.shadowOffsetX = config.textShadow.offsetX;
        ctx.shadowOffsetY = config.textShadow.offsetY;
      }
      ctx.fillStyle = config.colors.primaryName;
      ctx.font = `${config.fonts.primaryName.weight} ${config.fonts.primaryName.size}px Arial`;
      ctx.textAlign = "left";
      const displayName = options.guestName || options.eventName;
      ctx.fillText(displayName, textBgX + 10, textBgY + 35);

      // Draw event name (if guest name is provided)
      if (options.guestName) {
        ctx.font = `${config.fonts.eventName.weight} ${config.fonts.eventName.size}px Arial`;
        ctx.fillStyle = config.colors.eventName;
        ctx.fillText(options.eventName, textBgX + 10, textBgY + 60);
      }

      // Draw date and time
      if (options.eventDate && options.eventTime) {
        ctx.font = `${config.fonts.dateTime.weight} ${config.fonts.dateTime.size}px Arial`;
        ctx.fillStyle = config.colors.dateTime;
        const dateTime = `${formatDateString(options.eventDate)} at ${
          options.eventTime
        }`;
        ctx.fillText(
          dateTime,
          textBgX + 10,
          options.guestName ? textBgY + 85 : textBgY + 60
        );
      }

      // Draw location
      if (options.eventLocation) {
        ctx.font = `${config.fonts.location.weight} ${config.fonts.location.size}px Arial`;
        ctx.fillStyle = config.colors.location;
        const yPosition = options.guestName ? textBgY + 110 : textBgY + 85;
        ctx.fillText(options.eventLocation, textBgX + 10, yPosition);
      }

      // Draw ticket type with highlight
      ctx.font = `${config.fonts.ticketType.weight} ${config.fonts.ticketType.size}px Arial`;
      ctx.fillStyle = config.colors.ticketType;
      const ticketTypeText = `${options.ticketTypeName} - ${formatPriceString(
        options.ticketPrice
      )}`;
      const ticketTypeY = options.guestName ? textBgY + 135 : textBgY + 110;
      ctx.fillText(ticketTypeText, textBgX + 10, ticketTypeY);

      // Draw ticket number
      ctx.font = `${config.fonts.ticketNumber.weight} ${config.fonts.ticketNumber.size}px Arial`;
      ctx.fillStyle = config.colors.ticketNumber;
      const ticketNumber = options.ticketNumber || "TIX-XXXXXXXX";
      const ticketNumberY = options.guestName ? textBgY + 160 : textBgY + 135;
      ctx.fillText(`Ticket #: ${ticketNumber}`, textBgX + 10, ticketNumberY);

      // Draw organizer info
      if (options.organizer) {
        ctx.font = `${config.fonts.organizer.weight} ${config.fonts.organizer.size}px Arial`;
        ctx.fillStyle = config.colors.organizer;
        const organizerY = options.guestName ? textBgY + 180 : textBgY + 155;
        ctx.fillText(
          `Organized by: ${options.organizer}`,
          textBgX + 10,
          organizerY
        );
      }
    }

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Convert canvas to data URL
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error generating ticket preview:", err);
    return null;
  }
}

// Helper function to convert File to base64
function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper function to format date string
function formatDateString(dateString: string): string {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper function to format price
function formatPriceString(price: string | number | undefined): string {
  if (!price || parseFloat(price.toString()) === 0) return "Free";
  return `$${parseFloat(price.toString()).toFixed(2)}`;
}

import { writable } from "svelte/store";
import { toDataURL } from "qrcode";

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
export async function generateQrImage(data) {
  const qrImage = toDataURL(data);
  return qrImage;
}

//get the domain of my site
export function getDomain() {
  try {
    return new URL(window.location.href).hostname;
  } catch (error) {
    console.error("Error getting domain:", error);
    return null; // Or handle the error as needed
  }
}

//function to download image
export function downloadImage(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
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
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description: string;
    duration: number;
    show: boolean;
  }>
});

// Toast actions
export const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, description: string, duration = 6000) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  
  toastStore.update(state => ({
    toasts: [...state.toasts, {
      id,
      type,
      title,
      description,
      duration,
      show: true
    }]
  }));
  
  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
};

export const hideToast = (id: string) => {
  toastStore.update(state => ({
    toasts: state.toasts.map(toast => 
      toast.id === id ? { ...toast, show: false } : toast
    )
  }));
  
  // Remove from array after animation
  setTimeout(() => {
    removeToast(id);
  }, 300);
};

export const removeToast = (id: string) => {
  toastStore.update(state => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  }));
};

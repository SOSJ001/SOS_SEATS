//@ts-nocheck
import { writable, readable } from "svelte/store";
  import { toDataURL, } from "qrcode";
export let sessionFromDb = writable(null);

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
    const qrImage = toDataURL(data)    
    return qrImage
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

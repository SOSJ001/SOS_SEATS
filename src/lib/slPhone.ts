/** Normalise a Sierra Leone number to +232XXXXXXXX, or null if invalid. */
export function formatSlPhone(raw: string): string | null {
  let phone = String(raw || "").trim().replace(/[\s\-()]/g, "");
  if (phone.startsWith("+")) {
    // keep as is
  } else if (phone.startsWith("232")) {
    phone = `+${phone}`;
  } else {
    if (phone.startsWith("0")) phone = phone.substring(1);
    phone = `+232${phone}`;
  }
  if (phone.startsWith("+2320") && phone.length === 13) {
    phone = phone.replace("+2320", "+232");
  }
  return /^\+232\d{8}$/.test(phone) ? phone : null;
}

/** "+23276543210" as "+232 76 543 210"; other input is returned unchanged. */
export function displaySlPhone(phone: string): string {
  const m = /^\+232(\d{2})(\d{3})(\d{3})$/.exec(phone);
  return m ? `+232 ${m[1]} ${m[2]} ${m[3]}` : phone;
}

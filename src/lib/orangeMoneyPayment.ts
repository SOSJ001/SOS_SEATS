// Orange Money payment handler using Monime API
import { monimeService } from "./monime.js";
import { calculateBookingFee } from "./fees.js";

/**
 * Calculate platform service fee
 */
export function calculatePlatformFee(ticketPrice: number): number {
  // Service fee removed for mobile money payments
  return 0;
}

export { calculateWithdrawalFee } from "./fees.js";

interface TicketPurchaseData {
  eventId: string;
  eventName?: string; // Optional event name for payment description
  selectedTickets: Record<string, number>;
  totalAmount: number;
  ticketDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  buyerInfo: {
    wallet_address?: string;
    name: string;
    phone?: string;
  };
}

/**
 * Handle Mobile Money payment using Payment Code (in-app, no redirect)
 */
export async function handleMobileMoneyPaymentWithCode(
  purchaseData: TicketPurchaseData,
  paymentMethod: string = "orange_money"
): Promise<{
  success: boolean;
  paymentCodeId?: string;
  ussdCode?: string;
  error?: string;
  status?: number;
  code?: string;
  apiMessage?: string;
}> {
  try {
    // Validate purchase data
    if (purchaseData.totalAmount <= 0) {
      return { success: false, error: "Invalid amount" };
    }

    // Calculate platform fees (disabled)
    let totalPlatformFee = 0;

    // Calculate base total (ticket price only; no platform fee)
    const baseTotal = purchaseData.totalAmount;

    // Buyer booking fee from PUBLIC_BOOKING_FEE_PERCENT (covers gateway cut)
    const monimeFee = calculateBookingFee(baseTotal);
    const totalAmountWithFee = baseTotal + monimeFee;

    // Map payment method to Monime provider IDs
    const providerMap: Record<string, string[]> = {
      orange_money: ["m17"],
      afrimoney: ["m18"],
    };

    const authorizedProviders = providerMap[paymentMethod] || ["m17"];

    // Create payment code name with event name (or default to "SOS SEATS")
    const eventName = purchaseData.eventName || "SOS SEATS";
    const ticketNames = purchaseData.ticketDetails
      .map((t) => t.name)
      .join(", ");
    const paymentCodeName = `${eventName} - ${ticketNames}`;

    // Create payment code
    const paymentCode = await monimeService.createPaymentCode(
      paymentCodeName,
      {
        currency: "SLE", // ISO currency code for Sierra Leonean Leone
        value: Math.round(totalAmountWithFee * 100), // Convert to cents
      },
      authorizedProviders,
      {
        event_id: purchaseData.eventId,
        event_name: purchaseData.eventName || "SOS SEATS",
        buyer_name: purchaseData.buyerInfo.name,
        buyer_wallet: purchaseData.buyerInfo.wallet_address || "guest",
        payment_method: paymentMethod,
        ...(purchaseData.buyerInfo.phone
          ? { phone: purchaseData.buyerInfo.phone }
          : {}),
        total_tickets: purchaseData.ticketDetails.length.toString(),
        total_amount: purchaseData.totalAmount.toString(),
        platform_fee: totalPlatformFee.toString(),
        processing_fee: (totalAmountWithFee - baseTotal).toFixed(2),
        base_total: baseTotal.toFixed(2),
        total_with_fee: totalAmountWithFee.toString(),
        ticket_details: JSON.stringify(purchaseData.ticketDetails),
        selected_tickets: JSON.stringify(purchaseData.selectedTickets),
      },
      `sos_seats_${purchaseData.eventId}_${Date.now()}`
    );

    return {
      success: true,
      paymentCodeId: paymentCode.id,
      ussdCode: paymentCode.ussdCode,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Payment setup failed";
    const details = (error ?? {}) as {
      status?: number;
      code?: string;
      apiMessage?: string;
    };

    return {
      success: false,
      error: errorMessage,
      status: details.status,
      code: details.code,
      apiMessage: details.apiMessage,
    };
  }
}
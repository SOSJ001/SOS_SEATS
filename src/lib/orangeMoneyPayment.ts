// Orange Money payment handler using Monime API
import { monimeService } from "./monime.js";

// Platform fee configuration
const PLATFORM_FEE_PERCENTAGE = 0.1; // 10% platform fee (adjust as needed)
const PLATFORM_FEE_MIN = 2; // Minimum fee in SLE (e.g., 2 SLE)
const PLATFORM_FEE_MAX = 50; // Maximum fee in SLE (optional cap)

/**
 * Calculate platform service fee
 */
export function calculatePlatformFee(ticketPrice: number): number {
  const percentageFee = ticketPrice * PLATFORM_FEE_PERCENTAGE;
  const fee = Math.max(
    PLATFORM_FEE_MIN,
    Math.min(percentageFee, PLATFORM_FEE_MAX || Infinity)
  );
  return Math.round(fee * 100) / 100; // Round to 2 decimal places
}

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
}> {
  try {
    // Validate purchase data
    if (purchaseData.totalAmount <= 0) {
      return { success: false, error: "Invalid amount" };
    }

    // Calculate platform fees
    let totalPlatformFee = 0;
    purchaseData.ticketDetails.forEach((ticket) => {
      const platformFee = calculatePlatformFee(ticket.price);
      totalPlatformFee += platformFee * ticket.quantity;
    });

    const totalAmountWithFee = purchaseData.totalAmount + totalPlatformFee;

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
        currency: "SLE",
        value: Math.round(totalAmountWithFee * 100), // Convert to cents
      },
      authorizedProviders,
      {
        event_id: purchaseData.eventId,
        event_name: purchaseData.eventName || "SOS SEATS",
        buyer_name: purchaseData.buyerInfo.name,
        buyer_wallet: purchaseData.buyerInfo.wallet_address || "guest",
        payment_method: paymentMethod,
        total_tickets: purchaseData.ticketDetails.length.toString(),
        total_amount: purchaseData.totalAmount.toString(),
        platform_fee: totalPlatformFee.toString(),
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

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Process Orange Money payment callback
 */
export async function processOrangeMoneyCallback(
  sessionId: string,
  purchaseData: TicketPurchaseData,
  paymentMethod: string = "orange_money",
  skipStatusCheck: boolean = false
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const amountInSLE = purchaseData.totalAmount || 0;

    // Payment codes already confirmed as completed, skip status check
    // The modal handles payment code status polling

    // Import the createPaidTicketOrder function and anonymous key
    // Cache bust comment - updated to force browser refresh
    const { createPaidTicketOrder, ANONYMOUS_KEY } = await import(
      "./supabase.js"
    );

    // Create payment info for database
    // Use session/code ID as transaction ID
    const transactionId = sessionId;

    const paymentInfo = {
      paymentMethod: paymentMethod,
      transactionSignature: transactionId,
      amount: amountInSLE,
      receivingWallet: `monime_${paymentMethod}`, // Dynamic identifier based on payment method
      buyerWallet: `mobile_money_${paymentMethod}`, // Use meaningful identifier for mobile money payments
      provider: "monime",
      sessionId: sessionId,
      currency: "SLE", // Sierra Leone Leone for mobile money
    };

    // Import the claimFreeTickets function to use the same logic as Solana payments
    const { claimFreeTickets } = await import("./supabase.js");

    // Record the purchase in database using the same function as Solana payments
    const result = await claimFreeTickets(
      purchaseData.eventId,
      purchaseData.selectedTickets,
      purchaseData.buyerInfo,
      paymentInfo as any
    );

    if (result.success) {
      return {
        success: true,
        orderId: result.orderId,
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to record purchase",
      };
    }
  } catch (error) {
    console.error("Orange Money callback processing error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Callback processing failed",
    };
  }
}

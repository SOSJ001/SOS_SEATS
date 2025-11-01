// Orange Money payment handler using Monime API
import { monimeService } from "./monime.js";

// Platform fee configuration (disabled)
const PLATFORM_FEE_PERCENTAGE = 0; // disabled
const PLATFORM_FEE_MIN = 0; // disabled
const PLATFORM_FEE_MAX = 0; // disabled

/**
 * Calculate platform service fee
 */
export function calculatePlatformFee(ticketPrice: number): number {
  // Service fee removed for mobile money payments
  return 0;
}

/**
 * Calculate platform withdrawal fee
 */
export function calculateWithdrawalFee(withdrawalAmount: number): {
  platformFee: number;
  monimeFee: number;
  totalFees: number;
  netAmountAfterPlatformFee: number;
  netAmount: number;
} {
  // Withdrawal fee configuration
  const WITHDRAWAL_FEE_PERCENTAGE = 0.05; // 5% platform fee
  const MONIME_FEE_PERCENTAGE = 0.01; // 1% Monime processing fee (calculated on amount after platform fee)
  const WITHDRAWAL_FEE_MIN = 0; // Minimum fee (disabled)
  const WITHDRAWAL_FEE_MAX = 0; // Maximum fee (disabled)

  // Calculate platform fee (5% of withdrawal amount)
  let platformFee = withdrawalAmount * WITHDRAWAL_FEE_PERCENTAGE;

  // Apply min/max constraints if fee is enabled
  if (WITHDRAWAL_FEE_PERCENTAGE > 0) {
    if (WITHDRAWAL_FEE_MIN > 0 && platformFee < WITHDRAWAL_FEE_MIN) {
      platformFee = WITHDRAWAL_FEE_MIN;
    }
    if (WITHDRAWAL_FEE_MAX > 0 && platformFee > WITHDRAWAL_FEE_MAX) {
      platformFee = WITHDRAWAL_FEE_MAX;
    }
  }

  // Calculate net amount after platform fee (x)
  const netAmountAfterPlatformFee = Math.max(0, withdrawalAmount - platformFee);

  // Calculate Monime processing fee (1% of amount after platform fee)
  const monimeFee = netAmountAfterPlatformFee * MONIME_FEE_PERCENTAGE;

  // Calculate total fees (platform fee + Monime fee)
  const totalFees = platformFee + monimeFee;

  // Calculate final net amount user will receive (after both fees)
  const netAmount = Math.max(0, netAmountAfterPlatformFee - monimeFee);

  return {
    platformFee,
    monimeFee,
    totalFees,
    netAmountAfterPlatformFee,
    netAmount,
  };
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

    // Calculate platform fees (disabled)
    let totalPlatformFee = 0;

    // Calculate base total (ticket price only; no platform fee)
    const baseTotal = purchaseData.totalAmount;

    // Add Monime's 1% processing fee to the customer's total
    // This ensures we receive the full amount after Monime deducts their fee
    const monimeFee = baseTotal * 0.01;
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
        currency: "NLe",
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
      currency: "NLe", // Sierra Leone Leone for mobile money
    };

    // Import the claimFreeTickets function and supabase client
    const { claimFreeTickets, supabase } = await import("./supabase.js");

    // Check if an order with this transaction signature already exists (idempotency check)
    const { data: existingOrder, error: checkError } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("transaction_hash", transactionId)
      .eq("event_id", purchaseData.eventId)
      .eq("payment_method", paymentMethod)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine, other errors should be logged
      console.error("Error checking for existing order:", checkError);
    }

    // If order already exists, return success with existing order ID
    if (existingOrder) {
      return {
        success: true,
        orderId: existingOrder.id,
      };
    }

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

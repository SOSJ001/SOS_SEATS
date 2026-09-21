// Orange Money payment handler using Monime API
import { monimeService } from "./monime.js";
import {
  calculateBookingFee,
  getPlatformFeeRate,
  getWithdrawalFeeMax,
  getWithdrawalFeeMin,
  getWithdrawalMonimeFeeRate,
} from "./fees.js";

/**
 * Calculate platform service fee
 */
export function calculatePlatformFee(ticketPrice: number): number {
  // Service fee removed for mobile money payments
  return 0;
}

/**
 * Calculate platform withdrawal fee (rates from PUBLIC_WITHDRAWAL_* env)
 */
export function calculateWithdrawalFee(withdrawalAmount: number): {
  platformFee: number;
  monimeFee: number;
  totalFees: number;
  netAmountAfterPlatformFee: number;
  netAmount: number;
} {
  const WITHDRAWAL_FEE_PERCENTAGE = getPlatformFeeRate();
  const MONIME_FEE_PERCENTAGE = getWithdrawalMonimeFeeRate();
  const WITHDRAWAL_FEE_MIN = getWithdrawalFeeMin();
  const WITHDRAWAL_FEE_MAX = getWithdrawalFeeMax();

  let platformFee = withdrawalAmount * WITHDRAWAL_FEE_PERCENTAGE;

  if (WITHDRAWAL_FEE_PERCENTAGE > 0) {
    if (WITHDRAWAL_FEE_MIN > 0 && platformFee < WITHDRAWAL_FEE_MIN) {
      platformFee = WITHDRAWAL_FEE_MIN;
    }
    if (WITHDRAWAL_FEE_MAX > 0 && platformFee > WITHDRAWAL_FEE_MAX) {
      platformFee = WITHDRAWAL_FEE_MAX;
    }
  }

  const netAmountAfterPlatformFee = Math.max(0, withdrawalAmount - platformFee);

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
      currency: "SLE", // ISO currency code for Sierra Leonean Leone
    };

    // Kit service-role claim path (idempotency handled in /api/tickets/claim)
    const { claimFreeTickets } = await import("./supabase.js");

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

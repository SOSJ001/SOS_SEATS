// Orange Money payment handler using Monime API
import { monimeService } from "./monime.js";
import { PUBLIC_APP_URL } from "$env/static/public";

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

    // Create payment code
    const paymentCode = await monimeService.createPaymentCode(
      `SOS SEATS - ${purchaseData.ticketDetails.map((t) => t.name).join(", ")}`,
      {
        currency: "SLE",
        value: Math.round(totalAmountWithFee * 100), // Convert to cents
      },
      authorizedProviders,
      {
        event_id: purchaseData.eventId,
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
 * Handle Mobile Money payment for ticket purchase (Orange Money, Afrimoney, etc.)
 * Using Checkout Session (redirects to Monime)
 */
export async function handleMobileMoneyPayment(
  purchaseData: TicketPurchaseData,
  successUrl: string,
  cancelUrl: string,
  paymentMethod: string = "orange_money"
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  try {
    // Validate purchase data
    if (purchaseData.totalAmount <= 0) {
      return { success: false, error: "Invalid amount" };
    }

    // Limit Mobile Money to 1 ticket per order for now
    const totalTickets = Object.values(purchaseData.selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );
    if (totalTickets > 1) {
      return {
        success: false,
        error:
          "Mobile Money payments are currently limited to 1 ticket per order. Please select only 1 ticket or use Solana for multiple tickets.",
      };
    }

    // Calculate platform fees and create line items for Monime
    let totalPlatformFee = 0;
    const lineItems = purchaseData.ticketDetails.map((ticket) => {
      const platformFee = calculatePlatformFee(ticket.price);
      totalPlatformFee += platformFee * ticket.quantity;

      // Return ticket as line item
      // Note: Monime requires value in minor units (cents), so multiply by 100
      return {
        type: "custom" as const,
        name: ticket.name,
        price: { currency: "SLE", value: Math.round(ticket.price * 100) },
        quantity: ticket.quantity,
        description: `Event ticket: ${ticket.name}`,
        reference: ticket.id,
      };
    });

    // Add platform service fee as a separate line item
    // Note: Monime requires value in minor units (cents)
    if (totalPlatformFee > 0) {
      lineItems.push({
        type: "custom" as const,
        name: "Service Fee",
        price: { currency: "SLE", value: Math.round(totalPlatformFee * 100) },
        quantity: 1,
        description: "Platform service fee",
        reference: "platform_fee",
      });
    }

    // Update total amount to include platform fee
    const totalAmountWithFee = purchaseData.totalAmount + totalPlatformFee;

    // Generate URLs with purchase data backup
    const { successUrl: successUrlWithData, cancelUrl: cancelUrlWithData } =
      await generateOrangeMoneyUrls(
        purchaseData.eventId,
        undefined,
        purchaseData,
        paymentMethod
      );

    // Create checkout session with Monime
    const checkoutSession = await monimeService.createCheckoutSession(
      `SOS SEATS - Event Tickets (${purchaseData.ticketDetails.length} items)`,
      `Event tickets for ${purchaseData.ticketDetails.length} items`,
      successUrlWithData,
      cancelUrlWithData,
      lineItems,
      {
        event_id: purchaseData.eventId,
        buyer_name: purchaseData.buyerInfo.name,
        buyer_wallet: purchaseData.buyerInfo.wallet_address || "guest",
        payment_method: paymentMethod,
        total_tickets: purchaseData.ticketDetails.length.toString(),
        total_amount: purchaseData.totalAmount.toString(),
        platform_fee: totalPlatformFee.toString(),
        total_with_fee: totalAmountWithFee.toString(),
      },
      `sos_seats_${purchaseData.eventId}_${Date.now()}`
    );

    return {
      success: true,
      checkoutUrl: checkoutSession.checkout_url,
    };
  } catch (error) {
    console.error("Mobile Money payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment setup failed",
    };
  }
}

/**
 * Process Orange Money payment callback
 */
export async function processOrangeMoneyCallback(
  sessionId: string,
  purchaseData: TicketPurchaseData,
  paymentMethod: string = "orange_money"
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Get payment status from Monime
    const paymentStatus = await monimeService.getPaymentStatus(
      sessionId,
      paymentMethod
    );

    if (paymentStatus.status !== "completed") {
      return {
        success: false,
        error: `Payment not completed. Status: ${paymentStatus.status}`,
      };
    }

    // Import the createPaidTicketOrder function and anonymous key
    // Cache bust comment - updated to force browser refresh
    const { createPaidTicketOrder, ANONYMOUS_KEY } = await import(
      "./supabase.js"
    );

    // Create payment info for database
    // Note: paymentStatus.amount is in cents (minor units), convert to SLE
    const amountInSLE = paymentStatus.amount ? paymentStatus.amount / 100 : 0;

    const paymentInfo = {
      paymentMethod: paymentMethod,
      transactionSignature: paymentStatus.transaction_id || sessionId,
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

/**
 * Generate success and cancel URLs for Orange Money payment
 */
export async function generateOrangeMoneyUrls(
  eventId: string,
  sessionId?: string,
  purchaseData?: TicketPurchaseData,
  paymentMethod: string = "orange_money"
) {
  // Use PUBLIC_APP_URL for public redirects (needed for Monime live mode)
  // For Monime redirects, we MUST use a public URL (ngrok or production domain)
  // Fallback to window.location.origin only if PUBLIC_APP_URL is not set
  const baseUrl =
    PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  // Log warning if using localhost (for debugging)
  if (
    typeof window !== "undefined" &&
    baseUrl.includes("localhost") &&
    !PUBLIC_APP_URL
  ) {
    console.warn(
      "⚠️ Monime cancel redirect will fail: Using localhost URL. " +
        "Set PUBLIC_APP_URL in .env and restart dev server."
    );
  }

  // Pass minimal purchase data through URL parameters (Monime has 255 char limit)
  if (typeof window !== "undefined" && purchaseData) {
    // Only pass essential data, not full ticket details
    const buyerNameParam = encodeURIComponent(purchaseData.buyerInfo.name);
    const buyerWalletParam = encodeURIComponent(
      purchaseData.buyerInfo.wallet_address || ""
    );

    // Use shorter parameter names and minimal data to stay under 255 chars
    const successUrl = `${baseUrl}/payment/orange-money/success?e=${eventId}&s=${
      sessionId || ""
    }&n=${buyerNameParam}&w=${buyerWalletParam}&p=${paymentMethod}`;

    return {
      successUrl,
      // Use success URL for cancel too - we'll check status there
      // This avoids cross-site POST blocking issues
      cancelUrl: `${baseUrl}/marketplace/eventDetails/${eventId}?payment=cancelled`,
    };
  }

  return {
    successUrl: `${baseUrl}/payment/orange-money/success?event_id=${eventId}&session_id=${
      sessionId || ""
    }`,
    // Use success URL for cancel too - we'll check status there
    cancelUrl: `${baseUrl}/marketplace/eventDetails/${eventId}?payment=cancelled`,
  };
}

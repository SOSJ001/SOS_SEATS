// Orange Money payment handler using Monime API
import { monimeService } from "./monime.js";

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
 * Handle Orange Money payment for ticket purchase
 */
export async function handleOrangeMoneyPayment(
  purchaseData: TicketPurchaseData,
  successUrl: string,
  cancelUrl: string
): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
  try {
    // Validate purchase data
    if (purchaseData.totalAmount <= 0) {
      return { success: false, error: "Invalid amount" };
    }

    // Limit Orange Money to 1 ticket per order for now
    const totalTickets = Object.values(purchaseData.selectedTickets).reduce(
      (sum, qty) => sum + qty,
      0
    );
    if (totalTickets > 1) {
      return {
        success: false,
        error:
          "Orange Money payments are currently limited to 1 ticket per order. Please select only 1 ticket or use Solana for multiple tickets.",
      };
    }

    // Create line items for Monime
    const lineItems = purchaseData.ticketDetails.map((ticket) => ({
      type: "custom" as const,
      name: ticket.name,
      price: { currency: "SLE", value: ticket.price },
      quantity: ticket.quantity,
      description: `Event ticket: ${ticket.name}`,
      reference: ticket.id,
    }));

    // Generate URLs with purchase data backup
    const { successUrl: successUrlWithData, cancelUrl: cancelUrlWithData } =
      await generateOrangeMoneyUrls(
        purchaseData.eventId,
        undefined,
        purchaseData
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
        selected_tickets: purchaseData.selectedTickets,
        ticket_details: purchaseData.ticketDetails,
        buyer_name: purchaseData.buyerInfo.name,
        buyer_wallet: purchaseData.buyerInfo.wallet_address,
        payment_method: "orange_money",
      },
      `sos_seats_${purchaseData.eventId}_${Date.now()}`
    );

    return {
      success: true,
      checkoutUrl: checkoutSession.checkout_url,
    };
  } catch (error) {
    console.error("Orange Money payment error:", error);
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
  purchaseData: TicketPurchaseData
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Get payment status from Monime
    const paymentStatus = await monimeService.getPaymentStatus(sessionId);

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
    const paymentInfo = {
      paymentMethod: "orange_money",
      transactionSignature: paymentStatus.transaction_id || sessionId,
      amount: paymentStatus.amount,
      receivingWallet: "monime_orange_money", // Identifier for Monime Orange Money
      buyerWallet: ANONYMOUS_KEY, // Use actual Supabase anonymous key for non-authenticated Orange Money users
      provider: "monime",
      sessionId: sessionId,
      currency: "SLE", // Sierra Leone Leone for Orange Money
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
  purchaseData?: TicketPurchaseData
) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Pass purchase data directly through URL parameters as a more reliable method
  if (typeof window !== "undefined" && purchaseData) {
    const selectedTicketsParam = encodeURIComponent(
      JSON.stringify(purchaseData.selectedTickets)
    );
    const ticketDetailsParam = encodeURIComponent(
      JSON.stringify(purchaseData.ticketDetails)
    );
    const buyerNameParam = encodeURIComponent(purchaseData.buyerInfo.name);
    const buyerWalletParam = encodeURIComponent(
      purchaseData.buyerInfo.wallet_address || ""
    );

    const successUrl = `${baseUrl}/payment/orange-money/success?event_id=${eventId}&session_id=${
      sessionId || ""
    }&selected_tickets=${selectedTicketsParam}&ticket_details=${ticketDetailsParam}&buyer_name=${buyerNameParam}&buyer_wallet=${buyerWalletParam}`;

    return {
      successUrl,
      cancelUrl: `${baseUrl}/marketplace/eventDetails/${eventId}?payment=cancelled`,
    };
  }

  return {
    successUrl: `${baseUrl}/payment/orange-money/success?event_id=${eventId}&session_id=${
      sessionId || ""
    }`,
    cancelUrl: `${baseUrl}/marketplace/eventDetails/${eventId}?payment=cancelled`,
  };
}

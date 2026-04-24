import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultClient, ANONYMOUS_KEY } from "$lib/supabase/client.js";

export type Web3UserRow = {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
};

export type OrderBuyerInput = {
  id?: string | null;
  wallet_address?: string | null;
  email?: string | null;
  name?: string | null;
  display_name?: string | null;
};

export type OrderPaymentInfo = {
  paymentMethod: string;
  transactionSignature: string;
  currency?: string;
  buyerWallet?: string;
  provider?: string;
  sessionId?: string;
  amount?: number;
  receivingWallet?: string;
};

export type TicketLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderRpcRow = {
  success: boolean;
  order_id?: string;
  tickets_claimed?: number;
  error_message?: string;
};

type AuthDbResult =
  | { success: true; user: Web3UserRow }
  | {
      success: false;
      error: string;
      fallbackData?: OrderBuyerInput;
    };

async function authenticateUserForDatabase(
  userData: OrderBuyerInput,
  db: SupabaseClient = defaultClient
): Promise<AuthDbResult> {
  try {
    if (userData.wallet_address) {
      try {
        const { data: web3User, error } = await db
          .from("web3_users")
          .select("id, wallet_address, username, display_name")
          .eq("wallet_address", userData.wallet_address)
          .single();

        if (!error && web3User) {
          return {
            success: true,
            user: web3User as Web3UserRow,
          };
        }
      } catch {
        // continue
      }
    }

    if (userData.id) {
      try {
        const { data: user, error } = await db
          .from("web3_users")
          .select("id, wallet_address, username, display_name")
          .eq("id", userData.id)
          .single();

        if (!error && user) {
          return {
            success: true,
            user: user as Web3UserRow,
          };
        }
      } catch {
        // continue
      }
    }

    return {
      success: false,
      error: "User not found in database, using provided data",
      fallbackData: userData,
    };
  } catch (e: unknown) {
    console.error("Authentication error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return {
      success: false,
      error: message,
      fallbackData: userData,
    };
  }
}

export type PaidOrderResult =
  | {
      success: true;
      orderId: string;
      totalTicketsClaimed: number;
      orderNumber: string;
    }
  | { success: false; error: string };

export async function createPaidTicketOrder(
  eventId: string,
  selectedTickets: Record<string, number>,
  userData: OrderBuyerInput,
  paymentInfo: OrderPaymentInfo,
  ticketDetails: TicketLineItem[] | null = null
): Promise<PaidOrderResult> {
  try {
    const orderNumber = `PAID-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    let totalAmount = 0;
    let ticketTypeDetails: TicketLineItem[] = [];

    if (ticketDetails && ticketDetails.length > 0) {
      ticketTypeDetails = ticketDetails;
      totalAmount = ticketDetails.reduce(
        (sum, ticket) => sum + ticket.price * ticket.quantity,
        0
      );
    } else {
      for (const [selectedTicketTypeId, quantity] of Object.entries(
        selectedTickets
      )) {
        if (quantity > 0) {
          const ticketTypeIdToUse =
            typeof selectedTicketTypeId === "string"
              ? selectedTicketTypeId
              : String(selectedTicketTypeId);

          const { data: ticketType, error: ticketError } = await defaultClient
            .from("ticket_types")
            .select("*")
            .eq("id", ticketTypeIdToUse)
            .single();

          if (ticketError || !ticketType) {
            return {
              success: false,
              error: "Failed to get ticket type details",
            };
          }

          const ticketPrice =
            typeof ticketType.price === "string"
              ? parseFloat(ticketType.price)
              : Number(ticketType.price);

          totalAmount += ticketPrice * quantity;
          ticketTypeDetails.push({
            id: ticketType.id as string,
            name: ticketType.name as string,
            price: ticketPrice,
            quantity,
          });
        }
      }
    }

    const orderData: Record<string, unknown> = {
      event_id: eventId,
      buyer_id: userData.id ?? null,
      buyer_wallet_address: userData.wallet_address ?? null,
      buyer_email: userData.email ?? null,
      buyer_name: userData.name || userData.display_name || "Anonymous",
      order_number: orderNumber,
      total_amount: totalAmount,
      currency: paymentInfo.currency || "USDC",
      payment_method: paymentInfo.paymentMethod,
      payment_status: "completed",
      transaction_hash: paymentInfo.transactionSignature,
      order_status: "confirmed",
    };

    const authResult = await authenticateUserForDatabase(
      userData,
      defaultClient
    );
    if (authResult.success) {
      orderData.buyer_id = authResult.user.id;
      orderData.buyer_wallet_address = authResult.user.wallet_address;
      orderData.buyer_name =
        authResult.user.display_name || authResult.user.username;
    } else {
      const fallbackData = authResult.fallbackData ?? userData;
      orderData.buyer_wallet_address = fallbackData.wallet_address;
      orderData.buyer_name =
        fallbackData.name || fallbackData.display_name || "Anonymous";
    }

    const { data: rpcResult, error: rpcError } = await defaultClient.rpc(
      "create_paid_ticket_order_with_items",
      {
        p_event_id: eventId,
        p_buyer_wallet_address:
          (orderData.buyer_wallet_address as string | null) || "anonymous",
        p_buyer_name: orderData.buyer_name as string,
        p_order_number: orderNumber,
        p_ticket_details: ticketTypeDetails,
        p_total_amount: totalAmount,
        p_currency: paymentInfo.currency || "USDC",
        p_transaction_hash: paymentInfo.transactionSignature,
        p_payment_method: paymentInfo.paymentMethod || "solana",
      }
    );

    if (rpcError) {
      console.error("createPaidTicketOrder - Function call error:", rpcError);
      return {
        success: false,
        error: `Database function error: ${rpcError.message}`,
      };
    }

    const paidResult = rpcResult as OrderRpcRow[] | null;
    const paidError = rpcError;

    if (
      paidError ||
      !paidResult ||
      paidResult.length === 0 ||
      !paidResult[0].success
    ) {
      console.error(
        "createPaidTicketOrder - Paid ticket order creation failed:",
        {
          paidError,
          paidResult,
          orderData,
          ticketTypeDetails,
        }
      );

      const errorMessage =
        paidResult?.[0]?.error_message ||
        paidError?.message ||
        "Failed to create paid ticket order";
      if (errorMessage.includes("Not enough tickets available")) {
        return {
          success: false,
          error:
            "Sorry, some tickets are no longer available. Please refresh the page and try again.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const orderResult = paidResult[0];
    const orderId = orderResult.order_id;
    const totalTicketsClaimed = orderResult.tickets_claimed;

    if (!orderId || totalTicketsClaimed == null) {
      return { success: false, error: "Invalid order response from database" };
    }

    return {
      success: true,
      orderId,
      totalTicketsClaimed,
      orderNumber,
    };
  } catch (e: unknown) {
    console.error("createPaidTicketOrder - Error:", e);
    const message = e instanceof Error ? e.message : "Failed to create paid ticket order";
    return {
      success: false,
      error: message,
    };
  }
}

export type ClaimTicketsResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      ticketsClaimed: number;
      message: string;
    }
  | { success: false; error: string };

export async function claimFreeTickets(
  eventId: string,
  selectedTickets: Record<string, number>,
  userData: OrderBuyerInput,
  paymentInfo: OrderPaymentInfo | null = null,
  db: SupabaseClient = defaultClient
): Promise<ClaimTicketsResult> {
  try {
    const orderNumber = `${
      paymentInfo ? "PAID" : "FREE"
    }-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let totalAmount = 0;
    const ticketTypeDetails: TicketLineItem[] = [];

    for (const [selectedTicketTypeId, quantity] of Object.entries(
      selectedTickets
    )) {
      if (quantity > 0) {
        const ticketTypeIdToUse =
          typeof selectedTicketTypeId === "string"
            ? selectedTicketTypeId
            : String(selectedTicketTypeId);

        const { data: ticketType, error: ticketError } = await db
          .from("ticket_types")
          .select("*")
          .eq("id", ticketTypeIdToUse)
          .single();

        if (ticketError || !ticketType) {
          return {
            success: false,
            error: "Failed to get ticket type details",
          };
        }

        const ticketPrice =
          typeof ticketType.price === "string"
            ? parseFloat(ticketType.price)
            : Number(ticketType.price);

        totalAmount += ticketPrice * quantity;
        ticketTypeDetails.push({
          id: ticketType.id as string,
          name: ticketType.name as string,
          price: ticketPrice,
          quantity,
        });
      }
    }

    const orderData: Record<string, unknown> = {
      event_id: eventId,
      buyer_id: userData.id ?? null,
      buyer_wallet_address: userData.wallet_address ?? null,
      buyer_email: userData.email ?? null,
      buyer_name: userData.name || userData.display_name || "Anonymous",
      order_number: orderNumber,
      total_amount: totalAmount,
      currency: paymentInfo ? paymentInfo.currency || "USDC" : "NLe",
      payment_method: paymentInfo ? paymentInfo.paymentMethod : "free",
      payment_status: "completed",
      transaction_hash: paymentInfo ? paymentInfo.transactionSignature : null,
      order_status: "confirmed",
    };

    const authResult = await authenticateUserForDatabase(userData, db);
    if (authResult.success) {
      orderData.buyer_id = authResult.user.id;
      orderData.buyer_wallet_address = authResult.user.wallet_address;
      orderData.buyer_name =
        authResult.user.display_name || authResult.user.username;
    } else {
      const fallbackData = authResult.fallbackData ?? userData;
      orderData.buyer_wallet_address = fallbackData.wallet_address;
      orderData.buyer_name =
        fallbackData.name || fallbackData.display_name || "Anonymous";
    }

    if (paymentInfo?.buyerWallet) {
      orderData.buyer_wallet_address = paymentInfo.buyerWallet;
    }

    let orderId: string | null = null;
    let totalTicketsClaimed = 0;

    if (paymentInfo) {
      const { data: rpcResult, error: rpcError } = await db.rpc(
        "create_paid_ticket_order_with_items",
        {
          p_event_id: eventId,
          p_buyer_wallet_address:
            (orderData.buyer_wallet_address as string | null) ||
            ANONYMOUS_KEY ||
            "",
          p_buyer_name: orderData.buyer_name as string,
          p_order_number: orderNumber,
          p_ticket_details: ticketTypeDetails,
          p_total_amount: totalAmount,
          p_currency: paymentInfo.currency || "USDC",
          p_transaction_hash: paymentInfo.transactionSignature,
          p_payment_method: paymentInfo.paymentMethod || "solana",
        }
      );

      if (rpcError) {
        console.error("Function call error:", rpcError);
        return {
          success: false,
          error: `Database function error: ${rpcError.message}`,
        };
      }

      const paidResult = rpcResult as OrderRpcRow[] | null;
      const paidError = rpcError;

      if (
        paidError ||
        !paidResult ||
        paidResult.length === 0 ||
        !paidResult[0].success
      ) {
        console.error("Paid ticket order creation failed:", {
          paidError,
          paidResult,
          orderData,
          ticketTypeDetails,
        });

        const errorMessage =
          paidResult?.[0]?.error_message ||
          paidError?.message ||
          "Failed to create paid ticket order";
        if (errorMessage.includes("Not enough tickets available")) {
          return {
            success: false,
            error:
              "Sorry, some tickets are no longer available. Please refresh the page and try again.",
          };
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
      orderId = paidResult[0].order_id ?? null;
      totalTicketsClaimed = paidResult[0].tickets_claimed ?? 0;
    } else {
      const { data: freeResult, error: freeError } = await db.rpc(
        "create_free_ticket_order_with_items",
        {
          p_event_id: eventId,
          p_buyer_wallet_address: orderData.buyer_wallet_address as string,
          p_buyer_name: orderData.buyer_name as string,
          p_order_number: orderNumber,
          p_ticket_details: ticketTypeDetails,
        }
      );

      if (
        freeError ||
        !freeResult ||
        freeResult.length === 0 ||
        !(freeResult as OrderRpcRow[])[0].success
      ) {
        const fr = freeResult as OrderRpcRow[] | null;
        const errorMessage =
          fr?.[0]?.error_message ||
          freeError?.message ||
          "Failed to create free ticket order";
        if (errorMessage.includes("Not enough tickets available")) {
          throw new Error(
            "Sorry, some tickets are no longer available. Please refresh the page and try again."
          );
        }

        throw new Error(errorMessage);
      }
      const fr = freeResult as OrderRpcRow[];
      orderId = fr[0].order_id ?? null;
      totalTicketsClaimed = fr[0].tickets_claimed ?? 0;
    }

    if (orderId && totalTicketsClaimed > 0) {
      return {
        success: true,
        orderId,
        orderNumber,
        ticketsClaimed: totalTicketsClaimed,
        message: `Successfully claimed ${totalTicketsClaimed} ticket(s)`,
      };
    }

    return {
      success: false,
      error: "Failed to create order",
    };
  } catch (e: unknown) {
    console.error("Error claiming tickets:", e);
    const message =
      e instanceof Error ? e.message : "Failed to claim tickets";
    return {
      success: false,
      error: message,
    };
  }
}

import { supabase } from "$lib/supabase.js";
import { json } from "@sveltejs/kit";

export async function GET({ url }) {
  try {
    const walletAddress = url.searchParams.get("wallet");

    if (!walletAddress) {
      return json({
        success: false,
        error: "Wallet address required",
      });
    }

    // Test the load_tickets_by_current_owner function
    const { data: ticketsData, error: ticketsError } = await supabase.rpc(
      "load_tickets_by_current_owner",
      { p_wallet_address: walletAddress }
    );

    if (ticketsError) {
      console.error("Tickets function error:", ticketsError);
      return json({
        success: false,
        error: "Tickets function error: " + ticketsError.message,
        functionExists: false,
      });
    }

    // Test the load_orders_by_wallet function
    const { data: ordersData, error: ordersError } = await supabase.rpc(
      "load_orders_by_wallet",
      { p_wallet_address: walletAddress }
    );

    if (ordersError) {
      console.error("Orders function error:", ordersError);
      return json({
        success: false,
        error: "Orders function error: " + ordersError.message,
        ticketsFunctionExists: true,
        ordersFunctionExists: false,
      });
    }

    // Test the list_all_orders function
    const { data: allOrdersData, error: allOrdersError } = await supabase.rpc(
      "list_all_orders"
    );

    return json({
      success: true,
      walletAddress,
      ticketsCount: ticketsData?.length || 0,
      ordersCount: ordersData?.length || 0,
      allOrdersCount: allOrdersData?.length || 0,
      ticketsData: ticketsData || [],
      ordersData: ordersData || [],
      allOrdersData: allOrdersData || [],
      functionsExist: {
        load_tickets_by_current_owner: true,
        load_orders_by_wallet: true,
        list_all_orders: true,
      },
    });
  } catch (error) {
    console.error("Test tickets API error:", error);
    return json({
      success: false,
      error: error.message,
    });
  }
}

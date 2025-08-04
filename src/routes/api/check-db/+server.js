import { supabase } from "$lib/supabase.js";
import { json } from "@sveltejs/kit";

export async function GET() {
  try {
    // Check if tables exist and have data
    const checks = {};

    // Check orders table
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("count", { count: "exact", head: true });

      checks.orders = {
        exists: !ordersError,
        count: orders || 0,
        error: ordersError?.message,
      };
    } catch (error) {
      checks.orders = {
        exists: false,
        count: 0,
        error: error.message,
      };
    }

    // Check events table
    try {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("count", { count: "exact", head: true });

      checks.events = {
        exists: !eventsError,
        count: events || 0,
        error: eventsError?.message,
      };
    } catch (error) {
      checks.events = {
        exists: false,
        count: 0,
        error: error.message,
      };
    }

    // Check order_items table
    try {
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("count", { count: "exact", head: true });

      checks.order_items = {
        exists: !orderItemsError,
        count: orderItems || 0,
        error: orderItemsError?.message,
      };
    } catch (error) {
      checks.order_items = {
        exists: false,
        count: 0,
        error: error.message,
      };
    }

    // Check if functions exist
    try {
      const { data: functions, error: functionsError } = await supabase.rpc(
        "list_all_orders"
      );
      checks.functions = {
        list_all_orders: !functionsError,
        list_all_orders_error: functionsError?.message,
      };
    } catch (error) {
      checks.functions = {
        list_all_orders: false,
        list_all_orders_error: error.message,
      };
    }

    // Try to get a sample of orders
    let sampleOrders = [];
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .limit(5);

      if (!ordersError && orders) {
        sampleOrders = orders;
      }
    } catch (error) {
      // Ignore error for sample data
    }

    return json({
      success: true,
      checks,
      sampleOrders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check DB API error:", error);
    return json({
      success: false,
      error: error.message,
    });
  }
}

import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase URL and service role key
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseServiceKey = "YOUR_SUPABASE_SERVICE_ROLE_KEY";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllOrders() {
  try {
    console.log("🔄 Starting to clear all orders...");

    // First, clear order_items
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (itemsError) {
      console.error("❌ Error clearing order_items:", itemsError);
      return;
    }

    console.log("✅ Cleared order_items table");

    // Then, clear orders
    const { error: ordersError } = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

    if (ordersError) {
      console.error("❌ Error clearing orders:", ordersError);
      return;
    }

    console.log("✅ Cleared orders table");
    console.log("🎉 All orders have been successfully cleared!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the function
clearAllOrders();

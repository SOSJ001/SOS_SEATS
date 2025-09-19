<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    loadUserOrders,
    verifyWeb3Session,
    supabase,
    listAllOrders,
    getEventById,
  } from "$lib/supabase.js";
  import {
    sessionFromDb,
    showToast,
    generateTicketPreview,
    defaultTicketDesignConfig,
    type TicketDesignConfig,
    shareImageDataUrl,
    downloadImage,
  } from "$lib/store";
  import BackButton from "$lib/components/BackButton.svelte";
  import GradientButton from "$lib/components/GradientButton.svelte";
  import Spinner from "$lib/components/Spinner.svelte";
  import ToastContainer from "$lib/components/ToastContainer.svelte";

  // Get order ID from URL params
  $: orderId = $page.params.orderId;
  let order: any = null;
  let loading = true;
  let error: string | null = null;
  let ticketSummary: any = null;

  // Ticket preview state
  let eventDetails: any = null;
  let ticketPreviews: string[] = [];
  let generatingPreviews = false;
  let currentTicketIndex = 0;

  onMount(async () => {
    try {
      // First check if this is a temporary order stored in localStorage
      const tempOrders = JSON.parse(
        localStorage.getItem("tempFreeTicketOrders") || "[]"
      );
      const tempOrder = tempOrders.find((o: any) => o.id === orderId);
      if (tempOrder) {
        // This is a temporary order from localStorage
        order = {
          ...tempOrder,
          events: {
            name: "Event",
            date: new Date().toISOString(),
            location: "Event Location",
          },
          order_items: tempOrder.tickets.map((ticket: any) => ({
            ticket_types: {
              name: ticket.ticket_type_name,
            },
            ticket_number: ticket.ticket_number,
          })),
        };

        // Calculate ticket summary for temporary orders
        ticketSummary = {
          totalTickets: tempOrder.tickets.length,
          ticketTypes: tempOrder.tickets.reduce((acc: any, ticket: any) => {
            const typeName = ticket.ticket_type_name || "General Admission";
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
          }, {}),
        };
      } else {
        // Try to load from database - check both Web3 and traditional sessions
        let userId = null;
        let walletAddress = null;

        // Try Web3 session first
        const web3Session = await verifyWeb3Session();
        if (web3Session.success && web3Session.user) {
          userId = web3Session.user.id;
          walletAddress = web3Session.user.wallet_address;
        } else {
          // Fallback to traditional session
          userId = $sessionFromDb;
        }

        // Try to get the specific order by ID using the database function
        const { data: orderData, error: orderError } = await supabase.rpc(
          "get_order_with_items_by_id",
          { p_order_id: orderId }
        );

        if (!orderError && orderData && orderData.length > 0) {
          const orderResult = orderData[0];

          // Count total tickets from the function result (one row per order item)
          const totalTicketsFromFunction = orderData.length;

          // Get all order items for this order to calculate totals (this query is likely failing due to RLS)
          const { data: orderItemsData, error: itemsError } = await supabase
            .from("order_items")
            .select(
              `
              *,
              ticket_types (
                name,
                price
              ),
              guests (
                ticket_number
              )
            `
            )
            .eq("order_id", orderId);

          // Try a direct query without joins to see if order items exist
          const { data: simpleOrderItems, error: simpleItemsError } =
            await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", orderId);

          let totalTickets = 0;
          let ticketTypes: any = {};
          let orderItems: any = [];

          // Use the function result to determine total tickets
          if (totalTicketsFromFunction > 0) {
            totalTickets = totalTicketsFromFunction;
            ticketTypes = { "General Admission": totalTickets };

            // Create order items based on the function result
            orderItems = [];
            for (let i = 0; i < totalTickets; i++) {
              const row = orderData[i] || orderData[0]; // Use first row as fallback
              const orderItemsIds = row.order_items_ids || [];
              const orderItemId = orderItemsIds[i] || `function-${i}`;

              orderItems.push({
                id: orderItemId,
                ticket_types: {
                  name: row.ticket_type_name || "General Admission",
                  price:
                    row.ticket_type_price ||
                    orderResult.total_amount / totalTickets,
                },
                ticket_number: `TIX-${orderItemId}`,
              });
            }
          } else {
            // Fallback logic if function doesn't return data
            if (!itemsError && orderItemsData && orderItemsData.length > 0) {
              totalTickets = orderItemsData.length;
              orderItems = orderItemsData.map((item: any) => ({
                id: item.id, // Use order item ID for ticket number
                ticket_types: {
                  name: item.ticket_types?.name || "General Admission",
                  price: item.ticket_types?.price || 0,
                },
                ticket_number: item.guests?.ticket_number || `TIX-${item.id}`,
              }));

              // Group tickets by type
              orderItemsData.forEach((item: any) => {
                const typeName = item.ticket_types?.name || "General Admission";
                ticketTypes[typeName] = (ticketTypes[typeName] || 0) + 1;
              });
            } else {
              // If no order items found, try to get from guests table directly
              const { data: guestsData, error: guestsError } = await supabase
                .from("guests")
                .select(
                  `
                  *,
                  ticket_types (
                    name,
                    price
                  )
                `
                )
                .eq("event_id", orderResult.event_id)
                .eq("wallet_address", orderResult.buyer_wallet_address);

              // Try a simple guests query too
              const { data: simpleGuests, error: simpleGuestsError } =
                await supabase
                  .from("guests")
                  .select("*")
                  .eq("event_id", orderResult.event_id)
                  .eq("wallet_address", orderResult.buyer_wallet_address);

              // Let's check if the order itself exists in the database
              const { data: orderCheck, error: orderCheckError } =
                await supabase.from("orders").select("*").eq("id", orderId);

              // Let's also check all orders to see what's in the database
              const { data: allOrders, error: allOrdersError } = await supabase
                .from("orders")
                .select("*")
                .limit(5);

              if (!guestsError && guestsData && guestsData.length > 0) {
                totalTickets = guestsData.length;
                orderItems = guestsData.map((guest: any) => ({
                  id: guest.id,
                  ticket_types: {
                    name: guest.ticket_types?.name || "General Admission",
                    price: guest.ticket_types?.price || 0,
                  },
                  ticket_number:
                    guest.ticket_number ||
                    `TIX-${guest.id.toString().substring(0, 8)}`,
                }));

                // Group tickets by type
                guestsData.forEach((guest: any) => {
                  const typeName =
                    guest.ticket_types?.name || "General Admission";
                  ticketTypes[typeName] = (ticketTypes[typeName] || 0) + 1;
                });
              } else {
                // Final fallback: Calculate tickets from order amount
                if (
                  orderResult.payment_method === "solana" &&
                  orderResult.total_amount
                ) {
                  // For Solana payments, calculate based on actual price per ticket
                  // Since we don't have order items, we need to estimate
                  // Let's assume the price per ticket is the total amount divided by a reasonable number
                  // This is a fallback - ideally we should have order items
                  totalTickets = 1; // Default to 1 if we can't determine
                  ticketTypes = { "General Admission": totalTickets };

                  // Create dummy order items for display
                  for (let i = 0; i < totalTickets; i++) {
                    orderItems.push({
                      id: `dummy-${i}`,
                      ticket_types: {
                        name: "General Admission",
                        price: orderResult.total_amount,
                      },
                      ticket_number: `TIX-${orderResult.order_id?.toString().substring(0, 8) || "DUMMY"}-${i + 1}`,
                    });
                  }
                } else if (orderResult.payment_method === "free") {
                  // For free tickets, assume 1 ticket if no order items found
                  totalTickets = 1;
                  ticketTypes = { "Free Ticket": 1 };
                  orderItems = [
                    {
                      id: "dummy-1",
                      ticket_types: {
                        name: "Free Ticket",
                        price: 0,
                      },
                      ticket_number: `TIX-${orderResult.order_id?.toString().substring(0, 8) || "FREE"}-1`,
                    },
                  ];
                }
              }
            }
          }

          order = {
            id: orderResult.order_id,
            event_id: orderResult.event_id,
            buyer_wallet_address: orderResult.buyer_wallet_address,
            buyer_name: orderResult.buyer_name,
            order_number: orderResult.order_number,
            total_amount: orderResult.total_amount,
            currency: orderResult.currency,
            payment_method: orderResult.payment_method,
            payment_status: orderResult.payment_status,
            order_status: orderResult.order_status,
            created_at: orderResult.created_at,
            events: {
              name: orderResult.event_name || "Unknown Event",
              date: orderResult.event_date,
              location: orderResult.event_location || "Unknown",
            },
            order_items: orderItems,
          };

          ticketSummary = {
            totalTickets,
            ticketTypes,
          };
        } else {
          // If order not found in database, check if it's a temporary order
          const tempOrders = JSON.parse(
            localStorage.getItem("tempFreeTicketOrders") || "[]"
          );
          const tempOrder = tempOrders.find((o: any) => o.id === orderId);

          if (tempOrder) {
            order = {
              ...tempOrder,
              events: {
                name: "Event",
                date: new Date().toISOString(),
                location: "Event Location",
              },
              order_items: tempOrder.tickets.map((ticket: any) => ({
                ticket_types: { name: ticket.ticket_type_name },
                ticket_number: ticket.ticket_number,
              })),
            };

            // Calculate ticket summary for temporary orders
            ticketSummary = {
              totalTickets: tempOrder.tickets.length,
              ticketTypes: tempOrder.tickets.reduce((acc: any, ticket: any) => {
                const typeName = ticket.ticket_type_name || "General Admission";
                acc[typeName] = (acc[typeName] || 0) + 1;
                return acc;
              }, {}),
            };
          } else {
            error = "Order not found";
          }
        }
      }

      loading = false;

      // Generate ticket previews after order is loaded
      if (order && order.event_id) {
        await generateTicketPreviews();
      }
    } catch (err: any) {
      error = "Failed to load order";
      loading = false;
    }
  });

  // Generate ticket previews for all tickets in the order
  async function generateTicketPreviews() {
    if (!order || !order.event_id || generatingPreviews) return;

    generatingPreviews = true;
    try {
      // Get event details with design config
      eventDetails = await getEventById(order.event_id);

      if (!eventDetails) {
        console.warn("Could not load event details for ticket generation");
        return;
      }

      // Generate preview for each ticket
      const previews: string[] = [];

      for (let i = 0; i < (order.order_items?.length || 1); i++) {
        const item = order.order_items?.[i];
        const ticketNumber =
          item?.ticket_number || `TIX-${order.order_number}-${i + 1}`;
        const ticketTypeName = item?.ticket_types?.name || "General Admission";
        const ticketPrice =
          item?.ticket_types?.price ||
          (order.payment_method === "free"
            ? 0
            : order.total_amount / (order.order_items?.length || 1));

        // Use event's design config or default
        let designConfig: TicketDesignConfig = defaultTicketDesignConfig;
        if (eventDetails.ticket_design_config) {
          designConfig = eventDetails.ticket_design_config;

          // Ensure textBox.enabled exists for backward compatibility
          if (
            designConfig.textBox &&
            designConfig.textBox.enabled === undefined
          ) {
            designConfig.textBox.enabled = true;
          }
        }

        // Calculate dynamic canvas size based on event image
        const eventImage = eventDetails.images?.[0] || eventDetails.image;

        // Use fallback image if no event image is available
        const imageUrl =
          eventImage?.file_path ||
          "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop";

        if (eventImage?.file_path) {
          try {
            const imageDimensions = await getImageDimensions(
              eventImage.file_path
            );
            const canvasSize = calculateCanvasSize(
              imageDimensions.width,
              imageDimensions.height
            );

            designConfig = {
              ...designConfig,
              canvas: {
                width: canvasSize.width,
                height: canvasSize.height,
              },
            };
          } catch (imageError) {
            console.warn(
              "Could not get image dimensions, using default canvas size:",
              imageError
            );
          }
        }

        // Generate QR code data (using ticket number as unique identifier)
        const qrData = ticketNumber;

        // Generate ticket preview
        const previewUrl = await generateTicketPreview({
          eventName: eventDetails.name,
          eventDate: eventDetails.date,
          eventTime: eventDetails.time,
          eventLocation: eventDetails.location,
          eventImage: imageUrl,
          ticketTypeName: ticketTypeName,
          ticketPrice: ticketPrice,
          guestName: order.buyer_name || "Guest",
          organizer: eventDetails.organizer || "Event Organizer",
          ticketNumber: ticketNumber,
          qrData: qrData,
          designConfig: designConfig,
        });

        if (previewUrl) {
          previews.push(previewUrl);
        }
      }

      ticketPreviews = previews;
    } catch (err) {
      console.error("Error generating ticket previews:", err);
    } finally {
      generatingPreviews = false;
    }
  }

  // Helper function to get image dimensions
  async function getImageDimensions(
    imageSrc: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  // Helper function to calculate optimal canvas size based on image dimensions
  function calculateCanvasSize(
    imageWidth: number,
    imageHeight: number
  ): { width: number; height: number } {
    const minWidth = 300;
    const maxWidth = 800;
    const minHeight = 400;
    const maxHeight = 1200;

    const aspectRatio = imageWidth / imageHeight;

    let canvasWidth = imageWidth;
    let canvasHeight = imageHeight;

    if (canvasWidth < minWidth) {
      canvasWidth = minWidth;
      canvasHeight = canvasWidth / aspectRatio;
    } else if (canvasWidth > maxWidth) {
      canvasWidth = maxWidth;
      canvasHeight = canvasWidth / aspectRatio;
    }

    if (canvasHeight < minHeight) {
      canvasHeight = minHeight;
      canvasWidth = canvasHeight * aspectRatio;
    } else if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }

    return {
      width: Math.round(canvasWidth / 10) * 10,
      height: Math.round(canvasHeight / 10) * 10,
    };
  }

  // Download current ticket
  function downloadCurrentTicket() {
    if (!ticketPreviews[currentTicketIndex]) return;

    const filename = `ticket-${order.order_number}-${currentTicketIndex + 1}.png`;
    downloadImage(ticketPreviews[currentTicketIndex], filename);
  }

  // Share current ticket
  async function shareCurrentTicket() {
    if (!ticketPreviews[currentTicketIndex]) return;

    const filename = `ticket-${order.order_number}-${currentTicketIndex + 1}.png`;

    try {
      await shareImageDataUrl({
        dataUrl: ticketPreviews[currentTicketIndex],
        filename,
        title: "Your Ticket",
        text: `Here is your ticket for ${order.events?.name}`,
      });
    } catch (err) {
      console.error("Share failed, falling back to download:", err);
      downloadCurrentTicket();
    }
  }

  // Download all tickets
  function downloadAllTickets() {
    ticketPreviews.forEach((preview, index) => {
      setTimeout(() => {
        const filename = `ticket-${order.order_number}-${index + 1}.png`;
        downloadImage(preview, filename);
      }, index * 500); // Stagger downloads
    });
  }

  // Navigation functions for ticket slider
  function nextTicket() {
    if (currentTicketIndex < ticketPreviews.length - 1) {
      currentTicketIndex++;
    }
  }

  function prevTicket() {
    if (currentTicketIndex > 0) {
      currentTicketIndex--;
    }
  }

  function goToTicket(index: number) {
    if (index >= 0 && index < ticketPreviews.length) {
      currentTicketIndex = index;
    }
  }

  function downloadTickets() {
    if (ticketPreviews.length > 0) {
      downloadAllTickets();
    } else {
      showToast(
        "info",
        "Coming Soon",
        "Ticket download functionality will be implemented soon!"
      );
    }
  }

  function shareEvent() {
    if (navigator.share) {
      navigator.share({
        title: order?.events?.name || "Event",
        text: `I just got free tickets to ${order?.events?.name}!`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast("success", "Link Copied", "Event link copied to clipboard!");
    }
  }
</script>

<div class="min-h-screen bg-gray-900 text-white">
  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <Spinner />
        </div>
        <p class="text-gray-400">Loading ticket confirmation...</p>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-white mb-2">Order Not Found</h1>
        <p class="text-gray-400 mb-6">{error}</p>
        <button
          on:click={() => goto("/marketplace")}
          class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          Back to Marketplace
        </button>
      </div>
    </div>
  {:else if order}
    <!-- Back Button -->
    <BackButton
      top="top-20"
      left="left-6"
      link="/marketplace"
      title="Back to Marketplace"
    />

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <!-- Success Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div
            class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <svg
              class="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          {order.payment_method === "free"
            ? ticketSummary?.totalTickets === 1
              ? "Free Ticket Claimed!"
              : "Free Tickets Claimed!"
            : ticketSummary?.totalTickets === 1
              ? "Ticket Confirmed!"
              : "Tickets Confirmed!"}
        </h1>
        <p class="text-lg text-gray-300">
          Your {ticketSummary?.totalTickets === 1 ? "ticket" : "tickets"} for
          <span class="text-[#00F5FF] font-semibold">{order.events?.name}</span>
          {ticketSummary?.totalTickets === 1 ? "is" : "are"} ready
        </p>
      </div>

      <!-- Compact Order Summary -->
      <div class="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700/50">
        <div class="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div class="flex items-center gap-4">
            <span class="text-gray-400">Order:</span>
            <span class="text-white font-mono">{order.order_number}</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-400"
              >{ticketSummary?.totalTickets === 1
                ? "Ticket:"
                : "Tickets:"}</span
            >
            <span class="text-white font-semibold"
              >{ticketSummary?.totalTickets ||
                order.order_items?.length ||
                0}</span
            >
          </div>
          <div class="flex items-center gap-4">
            <span class="text-gray-400">Status:</span>
            <span class="text-green-400 font-semibold capitalize"
              >{order.payment_status}</span
            >
          </div>
          {#if order.payment_method === "solana"}
            <div class="flex items-center gap-4">
              <span class="text-gray-400">Paid:</span>
              <span class="text-white font-semibold"
                >{order.total_amount} {order.currency}</span
              >
            </div>
          {/if}
        </div>
      </div>

      <!-- Main Ticket Display -->
      {#if ticketPreviews.length > 0}
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-8 border border-gray-700 shadow-2xl"
        >
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-white mb-2">
              Your {ticketPreviews.length === 1 ? "Ticket" : "Tickets"}
            </h2>
            {#if ticketPreviews.length > 1}
              <p class="text-gray-400">
                Ticket {currentTicketIndex + 1} of {ticketPreviews.length}
              </p>
            {/if}
          </div>

          <!-- Ticket Preview Display -->
          <div class="relative">
            {#if generatingPreviews}
              <div class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="flex justify-center mb-4">
                    <Spinner />
                  </div>
                  <p class="text-gray-400">Generating ticket previews...</p>
                </div>
              </div>
            {:else}
              <!-- Main Ticket Display -->
              <div class="flex justify-center mb-8">
                <div class="relative max-w-md ticket-slider">
                  <div
                    class="bg-white p-6 rounded-xl shadow-2xl border-4 border-gray-300 transform hover:scale-105 transition-transform duration-300"
                  >
                    <img
                      src={ticketPreviews[currentTicketIndex]}
                      alt="Ticket Preview"
                      class="w-full h-auto rounded-lg"
                    />
                  </div>

                  <!-- Custom Design Indicator -->
                  {#if eventDetails?.ticket_design_config}
                    <div
                      class="absolute -top-3 -right-3 flex items-center gap-1 px-3 py-1 bg-purple-600 border-2 border-purple-400 rounded-full shadow-lg"
                    >
                      <svg
                        class="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                        />
                      </svg>
                      <span class="text-xs text-white font-bold"
                        >Custom Design</span
                      >
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Navigation Controls (only show if multiple tickets) -->
              {#if ticketPreviews.length > 1}
                <div class="flex items-center justify-center gap-6 mb-8">
                  <button
                    on:click={prevTicket}
                    disabled={currentTicketIndex === 0}
                    class="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <!-- Ticket Dots -->
                  <div class="flex gap-3">
                    {#each ticketPreviews as _, index}
                      <button
                        on:click={() => goToTicket(index)}
                        class="w-4 h-4 rounded-full ticket-dot {currentTicketIndex ===
                        index
                          ? 'bg-[#00F5FF] active shadow-lg'
                          : 'bg-gray-600 hover:bg-gray-500'}"
                      ></button>
                    {/each}
                  </div>

                  <button
                    on:click={nextTicket}
                    disabled={currentTicketIndex === ticketPreviews.length - 1}
                    class="p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              {/if}

              <!-- Ticket Actions -->
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  on:click={downloadCurrentTicket}
                  class="px-8 py-4 bg-gradient-to-r from-[#9D4EDD] to-[#00F5FF] text-white rounded-xl hover:from-[#9D4EDD]/90 hover:to-[#00F5FF]/90 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 hover:shadow-xl font-semibold"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Download Ticket</span>
                </button>

                <button
                  on:click={shareCurrentTicket}
                  class="px-8 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 hover:shadow-xl border border-gray-600 font-semibold"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  <span>Share Ticket</span>
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Additional Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        {#if ticketPreviews.length > 1}
          <GradientButton
            text="Download All Tickets"
            onClick={downloadTickets}
            icon="download"
            class_="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          />
        {/if}

        <GradientButton
          text="Share Event"
          onClick={shareEvent}
          icon="share"
          class_="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        />

        <button
          on:click={() => goto("/marketplace")}
          class="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 text-center"
        >
          Browse More Events
        </button>
      </div>

      <!-- Important Information -->
      <div class="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p class="text-blue-300 text-sm text-center">
          <span class="font-semibold">Important:</span> Your tickets are confirmed.
          Please arrive 15 minutes early and bring a valid ID.
        </p>
      </div>

      <!-- Temporary Solution Notice -->
      {#if order.id?.startsWith("temp-")}
        <div
          class="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
        >
          <h4 class="text-yellow-300 font-semibold mb-2">
            ⚠️ Temporary Solution
          </h4>
          <p class="text-yellow-200 text-sm">
            This order is temporarily stored locally while we resolve database
            permission issues. Your tickets are still valid for the event, but
            please contact support if you need a permanent record of your order.
          </p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Toast Container -->
  <ToastContainer />
</div>

<style>
  /* Smooth transitions for ticket slider */
  .ticket-slider {
    transition: all 0.3s ease-in-out;
  }

  .ticket-dot {
    transition: all 0.2s ease-in-out;
  }

  .ticket-dot:hover {
    transform: scale(1.2);
  }

  .ticket-dot.active {
    transform: scale(1.3);
  }

  /* Custom scrollbar for better UX */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
</style>

<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    verifyWeb3Session,
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
  import { ordersFulfill } from "$lib/client/walletData";

  // Get order ID from URL params
  $: orderId = $page.params.orderId;
  let order: any = null;
  let loading = true;
  let error: string | null = null;
  let ticketSummary: any = null;
  let orderGuestIds: string[] = [];

  // Ticket preview state
  let eventDetails: any = null;
  let loadingEventDetails = false;
  let ticketPreviews: string[] = [];
  let generatingPreviews = false;
  let previewProgress = { current: 0, total: 0 };
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

        // Load order + items via Kit fulfill API (service role)
        const orderWithItems = await ordersFulfill({
          action: "get-order-with-items",
          orderId,
        });
        const orderData = orderWithItems?.success ? orderWithItems.data : null;

        if (orderData && orderData.length > 0) {
          const orderResult = orderData[0];

          const itemsResult = await ordersFulfill({
            action: "list-order-items",
            orderId,
          });
          const actualOrderItems = itemsResult?.success
            ? itemsResult.data || []
            : [];

          let totalTickets = 0;
          let ticketTypes: any = {};
          let orderItems: any = [];

          const ticketTypeCache: Record<string, any> = {};
          async function resolveTicketType(ticketTypeId: string | null) {
            if (!ticketTypeId) return null;
            if (ticketTypeCache[ticketTypeId]) return ticketTypeCache[ticketTypeId];
            const tt = await ordersFulfill({
              action: "get-ticket-type",
              ticketTypeId,
            });
            ticketTypeCache[ticketTypeId] = tt?.success ? tt.data : null;
            return ticketTypeCache[ticketTypeId];
          }

          if (actualOrderItems.length > 0) {
            for (const item of actualOrderItems) {
              const quantity = item.quantity || 1;
              totalTickets += quantity;
              const tt = await resolveTicketType(item.ticket_type_id);
              const typeName =
                tt?.name ||
                orderResult.ticket_type_name ||
                "General Admission";
              const typePrice =
                tt?.price ??
                item.unit_price ??
                orderResult.ticket_type_price ??
                0;
              ticketTypes[typeName] = (ticketTypes[typeName] || 0) + quantity;
              for (let i = 0; i < quantity; i++) {
                orderItems.push({
                  id: `${item.id}-${i + 1}`,
                  guest_id: item.guest_id || null,
                  ticket_types: { name: typeName, price: typePrice },
                  ticket_number: `TIX-${item.id}-${i + 1}`,
                });
              }
            }
          } else {
            // Fallback from RPC row when items list is empty
            const totalAmount = parseFloat(orderResult.total_amount);
            const unitPrice = parseFloat(orderResult.ticket_type_price);
            if (unitPrice > 0) {
              totalTickets = Math.floor(totalAmount / unitPrice);
            } else {
              totalTickets = orderData.length || 1;
            }
            if (totalTickets < 1) totalTickets = 1;
            const typeName =
              orderResult.ticket_type_name ||
              (orderResult.payment_method === "free"
                ? "Free Ticket"
                : "General Admission");
            ticketTypes = { [typeName]: totalTickets };
            const orderItemsIds = orderResult.order_items_ids || [];
            const orderItemId = orderItemsIds[0] || `function-${orderId}`;
            for (let i = 0; i < totalTickets; i++) {
              orderItems.push({
                id: `${orderItemId}-${i + 1}`,
                guest_id: null,
                ticket_types: {
                  name: typeName,
                  price: orderResult.ticket_type_price || unitPrice || 0,
                },
                ticket_number: `TIX-${orderItemId}-${i + 1}`,
              });
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
          const tempOrdersRetry = JSON.parse(
            localStorage.getItem("tempFreeTicketOrders") || "[]"
          );
          const tempOrderRetry = tempOrdersRetry.find(
            (o: any) => o.id === orderId
          );

          if (tempOrderRetry) {
            order = {
              ...tempOrderRetry,
              events: {
                name: "Event",
                date: new Date().toISOString(),
                location: "Event Location",
              },
              order_items: tempOrderRetry.tickets.map((ticket: any) => ({
                ticket_types: { name: ticket.ticket_type_name },
                ticket_number: ticket.ticket_number,
              })),
            };

            ticketSummary = {
              totalTickets: tempOrderRetry.tickets.length,
              ticketTypes: tempOrderRetry.tickets.reduce(
                (acc: any, ticket: any) => {
                  const typeName =
                    ticket.ticket_type_name || "General Admission";
                  acc[typeName] = (acc[typeName] || 0) + 1;
                  return acc;
                },
                {}
              ),
            };
          } else {
            error = "Order not found";
          }
        }
      }

      loading = false;

      // Prefetch guest ids for this order to drive QR payloads
      if (order && order.event_id) {
        try {
          const guestIdsResult = await ordersFulfill({
            action: "get-order-guest-ids",
            orderId,
          });
          if (guestIdsResult?.success && Array.isArray(guestIdsResult.data)) {
            orderGuestIds = guestIdsResult.data as string[];
          }
        } catch (e) {
          // ignore
        }
        // Generate ticket previews after order is loaded
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
    previewProgress = { current: 0, total: order.order_items?.length || 1 };

    try {
      // Get event details with design config
      loadingEventDetails = true;
      eventDetails = await getEventById(order.event_id);
      loadingEventDetails = false;

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

        // Generate QR code data: prefer guest_id when available, then pre-fetched orderGuestIds, else fallback to ticket number
        const qrData =
          (item as any)?.guest_id || orderGuestIds[i] || ticketNumber;

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

        // Update progress
        previewProgress = {
          current: i + 1,
          total: order.order_items?.length || 1,
        };

        // Small delay to make progress visible (only if multiple tickets)
        if (order.order_items?.length > 1 && i < order.order_items.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      ticketPreviews = previews;
    } catch (err) {
      console.error("Error generating ticket previews:", err);
    } finally {
      generatingPreviews = false;
      loadingEventDetails = false;
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
    <!-- Enhanced Loading State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center max-w-md">
        <div class="flex justify-center mb-6">
          <div class="relative">
            <Spinner />
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-8 h-8 bg-gradient-to-r from-[#00F5FF] to-[#00FF88] rounded-full animate-pulse"
              ></div>
            </div>
          </div>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">
          Loading Your Order
        </h3>
        <p class="text-gray-400 mb-4">
          Fetching ticket details and preparing confirmation...
        </p>

        <!-- Animated Progress Dots -->
        <div class="flex justify-center space-x-1">
          <div class="w-2 h-2 bg-[#00F5FF] rounded-full animate-bounce"></div>
          <div
            class="w-2 h-2 bg-[#00FF88] rounded-full animate-bounce"
            style="animation-delay: 0.1s"
          ></div>
          <div
            class="w-2 h-2 bg-[#00F5FF] rounded-full animate-bounce"
            style="animation-delay: 0.2s"
          ></div>
        </div>
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
      {#if loadingEventDetails}
        <!-- Event Details Loading State -->
        <div class="flex items-center justify-center py-16">
          <div class="text-center max-w-md">
            <div class="flex justify-center mb-6">
              <div class="relative">
                <Spinner />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div
                    class="w-8 h-8 bg-gradient-to-r from-[#00F5FF] to-[#00FF88] rounded-full animate-pulse"
                  ></div>
                </div>
              </div>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">
              Loading Event Details
            </h3>
            <p class="text-gray-400 mb-4">
              Fetching event information and ticket design...
            </p>

            <!-- Animated Progress Dots -->
            <div class="flex justify-center space-x-1">
              <div
                class="w-2 h-2 bg-[#00F5FF] rounded-full animate-bounce"
              ></div>
              <div
                class="w-2 h-2 bg-[#00FF88] rounded-full animate-bounce"
                style="animation-delay: 0.1s"
              ></div>
              <div
                class="w-2 h-2 bg-[#00F5FF] rounded-full animate-bounce"
                style="animation-delay: 0.2s"
              ></div>
            </div>
          </div>
        </div>
      {:else}
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
            <span class="text-[#00F5FF] font-semibold"
              >{order.events?.name}</span
            >
            {ticketSummary?.totalTickets === 1 ? "is" : "are"} ready
          </p>
        </div>

        <!-- Compact Order Summary -->
        <div
          class="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700/50"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-4 text-sm"
          >
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
                <div class="flex items-center justify-center py-16">
                  <div class="text-center max-w-md">
                    <div class="flex justify-center mb-6">
                      <div class="relative">
                        <Spinner />
                        <div
                          class="absolute inset-0 flex items-center justify-center"
                        >
                          <div
                            class="w-8 h-8 bg-gradient-to-r from-[#00F5FF] to-[#00FF88] rounded-full animate-pulse"
                          ></div>
                        </div>
                      </div>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-2">
                      Creating Your Tickets
                    </h3>
                    <p class="text-gray-400 mb-4">
                      Generating beautiful ticket previews with QR codes...
                    </p>

                    <!-- Progress Bar -->
                    <div class="w-full bg-gray-700 rounded-full h-2 mb-4">
                      <div
                        class="bg-gradient-to-r from-[#00F5FF] to-[#00FF88] h-2 rounded-full transition-all duration-500 ease-out"
                        style="width: {previewProgress.total > 0
                          ? (previewProgress.current / previewProgress.total) *
                            100
                          : 0}%"
                      ></div>
                    </div>

                    <!-- Progress Text -->
                    <p class="text-sm text-gray-500 mb-4">
                      {previewProgress.current} of {previewProgress.total} tickets
                      generated
                    </p>

                    <div class="flex justify-center space-x-1">
                      <div
                        class="w-2 h-2 bg-[#00F5FF] rounded-full animate-bounce"
                      ></div>
                      <div
                        class="w-2 h-2 bg-[#00FF88] rounded-full animate-bounce"
                        style="animation-delay: 0.1s"
                      ></div>
                      <div
                        class="w-2 h-2 bg-[#00F5FF] rounded-full animate-bounce"
                        style="animation-delay: 0.2s"
                      ></div>
                    </div>
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
                      disabled={currentTicketIndex ===
                        ticketPreviews.length - 1}
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
        <div
          class="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
        >
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
              please contact support if you need a permanent record of your
              order.
            </p>
          </div>
        {/if}
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

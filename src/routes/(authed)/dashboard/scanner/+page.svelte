<script lang="ts">
  import { onMount } from "svelte";
  import {
    supabase,
    validateAndCheckInTicket,
    checkInGuest,
    loadScanHistory,
  } from "$lib/supabase";
  import { showToast } from "$lib/store";
  import EventSelector from "$lib/components/EventSelector.svelte";
  import QRScanner from "$lib/components/Qrscanner.svelte";
  import ScanResult from "$lib/components/ScanResult.svelte";
  import ScanHistory from "$lib/components/ScanHistory.svelte";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";

  // Real events data from database
  let events: any[] = [];
  let selectedEvent = "";
  let isScanning = false;
  let currentScanResult: any = null;
  let scanHistory: any[] = [];
  let loading = true;
  let error: string | null = null;

  // Confirmation dialog state
  let showConfirmDialog = false;
  let confirmDialogData = {
    title: "",
    message: "",
    confirmText: "",
    confirmVariant: "success" as const,
  };

  // Confirmation dialog modes and pending wallet flow
  let confirmMode: "start" | "wallet" | "guest" = "start";
  let pendingWalletAddress: string | null = null;
  let pendingGuestId: string | null = null;
  
  // Valid ticket info (for showing before check-in)
  let validTicketInfo: {
    type: "guest" | "wallet";
    guestId?: string;
    walletAddress?: string;
    guestName?: string;
    ticketType?: string;
    unscannedCount?: number;
  } | null = null;

  // Animation states
  let isLoaded = false;
  let showScanner = false;
  let showHistory = false;

  // Manual input for testing
  let showManualInput = false;
  let manualWalletAddress = "";

  // React to event changes when bound value updates
  let __prevSelectedEvent = "";
  $: if (selectedEvent !== __prevSelectedEvent) {
    __prevSelectedEvent = selectedEvent;
    if (selectedEvent) {
      handleEventChange(selectedEvent); // Fire and forget async call
    }
  }

  onMount(async () => {
    await loadEvents();

    // Load scan history for selected event if available
    if (selectedEvent) {
      await loadScanHistoryForEvent(selectedEvent);
    }

    // Trigger entrance animations
    setTimeout(() => {
      isLoaded = true;
    }, 100);

    setTimeout(() => {
      showScanner = true;
    }, 300);

    setTimeout(() => {
      showHistory = true;
    }, 500);
  });

  async function loadEvents() {
    try {
      loading = true;
      error = null;

      // Load events from database
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("id, name, date, location, status")
        .in("status", ["published", "live"])
        .order("date", { ascending: true });

      if (eventsError) {
        throw new Error(`Failed to load events: ${eventsError.message}`);
      }

      events = eventsData || [];

      // Set first event as selected if available
      if (events.length > 0 && !selectedEvent) {
        selectedEvent = events[0].id;
        // Load scan history for the selected event
        await loadScanHistoryForEvent(selectedEvent);
      }
    } catch (err) {
      console.error("Error loading events:", err);
      error = err instanceof Error ? err.message : "Failed to load events";
      showToast("error", "Error", error);
    } finally {
      loading = false;
    }
  }

  async function handleEventChange(eventId: string) {
    selectedEvent = eventId;
    // Reset scan state when event changes
    isScanning = false;
    currentScanResult = null;
    validTicketInfo = null;
    // Load scan history for the new event
    if (eventId) {
      await loadScanHistoryForEvent(eventId);
    }
  }

  async function loadScanHistoryForEvent(eventId: string) {
    try {
      const history = await loadScanHistory(eventId, 50);
      scanHistory = history;
    } catch (err) {
      console.error("Error loading scan history:", err);
      // Don't show error toast, just log it
    }
  }

  function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  }

  function isLikelySolanaAddress(value: string) {
    // Base58, typically 32-44 chars, no 0,O,I,l
    return /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(value);
  }

  async function processWalletScan(walletAddress: string) {
    const res = await validateAndCheckInTicket(walletAddress, selectedEvent);
    return {
      route: "wallet" as const,
      result: res,
      scannedValue: walletAddress,
    };
  }

  async function handleScanResult(scannedValue: string) {
    if (!selectedEvent) {
      showToast(
        "error",
        "No Event Selected",
        "Please select an event before scanning"
      );
      return;
    }

    try {
      let result: any;
      let route: "guest" | "wallet" | "invalid" = "invalid";

      if (isUuid(scannedValue)) {
        // Guest ID path
        route = "guest";
        // Enforce selected event: ensure guest belongs to selectedEvent before check-in
        const { data: guestRow, error: guestErr } = await supabase
          .from("guests")
          .select("id, event_id, status, check_in_time, first_name, last_name, ticket_type_id")
          .eq("id", scannedValue)
          .maybeSingle();
        
        // Get ticket type name separately if needed
        let ticketTypeName = "Ticket";
        if (guestRow && guestRow.ticket_type_id) {
          const { data: ticketType } = await supabase
            .from("ticket_types")
            .select("name")
            .eq("id", guestRow.ticket_type_id)
            .maybeSingle();
          if (ticketType) {
            ticketTypeName = ticketType.name;
          }
        }

        if (guestErr || !guestRow) {
          result = {
            success: false,
            message: "Guest not found",
          };
        } else if (guestRow.event_id !== selectedEvent) {
          result = {
            success: false,
            message: "Invalid code",
          };
        } else if (guestRow.check_in_time) {
          // Already checked in
          const checkInDate = new Date(guestRow.check_in_time);
          const formattedDate = checkInDate.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          result = {
            success: false,
            message: `This ticket has already been checked in on ${formattedDate}. Each ticket can only be used once.`,
          };
        } else if (guestRow.status && guestRow.status !== "confirmed") {
          result = { success: false, message: "Invalid code" };
        } else {
          // Valid ticket - show result card with check-in button
          validTicketInfo = {
            type: "guest",
            guestId: scannedValue,
            guestName: `${guestRow.first_name} ${guestRow.last_name}`,
            ticketType: ticketTypeName,
          };
          currentScanResult = {
            success: true, // Use success to show valid ticket UI
            message: "Ticket is valid and ready to check in",
            guestName: validTicketInfo.guestName,
            ticketType: validTicketInfo.ticketType,
            section: "General Admission",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isPending: true, // Flag to indicate this is before check-in
          };
          isScanning = false;
          return;
        }
      } else if (isLikelySolanaAddress(scannedValue)) {
        // Wallet path (Web3) — if multiple unscanned tickets exist, confirm before consuming one
        const { data: orderRows } = await supabase
          .from("orders")
          .select("id")
          .eq("event_id", selectedEvent);
        const orderIds = orderRows?.map((o: any) => o.id) || [];

        let unscannedCount = 0;
        if (orderIds.length > 0) {
          const { count } = await supabase
            .from("order_items")
            .select("id", { count: "exact", head: true })
            .eq("current_owner", scannedValue)
            .is("check_in_time", null)
            .in("order_id", orderIds);
          unscannedCount = count || 0;
        }

        // Check if tickets exist but are all checked in
        if ((unscannedCount || 0) < 1) {
          // Check if there are any tickets for this wallet (to show better error)
          const { data: checkedInTickets } = await supabase
            .from("order_items")
            .select("check_in_time, orders(buyer_name)")
            .eq("current_owner", scannedValue)
            .in("order_id", orderIds)
            .not("check_in_time", "is", null)
            .order("check_in_time", { ascending: false })
            .limit(1);

          if (checkedInTickets && checkedInTickets.length > 0 && checkedInTickets[0].check_in_time) {
            // All tickets checked in
            const checkInDate = new Date(checkedInTickets[0].check_in_time);
            const formattedDate = checkInDate.toLocaleString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            result = {
              success: false,
              message: `All tickets for this wallet have already been checked in. Last check-in: ${formattedDate}. Each ticket can only be used once.`,
            };
          } else {
            route = "invalid";
            result = { success: false, message: "Invalid code" };
          }
        } else {
          // Valid ticket - show result card with check-in button
          // Get buyer name for display
          const { data: ticketInfo } = await supabase
            .from("order_items")
            .select("orders(buyer_name), ticket_types(name)")
            .eq("current_owner", scannedValue)
            .is("check_in_time", null)
            .in("order_id", orderIds)
            .limit(1)
            .maybeSingle();

          validTicketInfo = {
            type: "wallet",
            walletAddress: scannedValue,
            guestName: ticketInfo?.orders?.buyer_name || "Ticket Holder",
            ticketType: ticketInfo?.ticket_types?.name || "Ticket",
            unscannedCount: unscannedCount,
          };
          currentScanResult = {
            success: true, // Use success to show valid ticket UI
            message: unscannedCount > 1 
              ? `${unscannedCount} unscanned tickets available`
              : "Ticket is valid and ready to check in",
            guestName: validTicketInfo.guestName,
            ticketType: validTicketInfo.ticketType,
            section: "General Admission",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isPending: true, // Flag to indicate this is before check-in
          };
          isScanning = false;
          return;
        }
      } else {
        route = "invalid";
        result = { success: false, message: "Invalid code format" };
      }

      if (result.success) {
        // Success - ticket checked in
        const ticketInfo = result.ticketInfo;

        currentScanResult = {
          success: true,
          message: result.message,
          guestName: ticketInfo.original_buyer_name || "Unknown",
          ticketType: ticketInfo.ticket_type_name || "Standard Ticket",
          section: "General Admission",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ticketInfo: ticketInfo,
        };

        // Reload scan history from database
        if (selectedEvent) {
          await loadScanHistoryForEvent(selectedEvent);
        }

        showToast(
          "success",
          "Ticket Validated",
          `${ticketInfo.original_buyer_name} checked in successfully`
        );
      } else {
        // Error - ticket invalid or already checked in
        currentScanResult = {
          success: false,
          message: result.message,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        // Don't add failed scans to history (only successful check-ins are stored)

        showToast("error", "Validation Failed", result.message);
      }
    } catch (err) {
      console.error("Error processing scan result:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      currentScanResult = {
        success: false,
        message: errorMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      showToast("error", "Scan Error", errorMessage);
    }

    // Stop scanning after result
    isScanning = false;
  }

  function startScanning() {
    if (!selectedEvent) {
      showToast(
        "error",
        "No Event Selected",
        "Please select an event before scanning"
      );
      return;
    }

    // Clear previous scan result to show camera again
    currentScanResult = null;
    validTicketInfo = null;
    isScanning = true;
  }

  function stopScanning() {
    isScanning = false;
  }

  function showScanConfirmation() {
    if (!selectedEvent) {
      showToast(
        "error",
        "No Event Selected",
        "Please select an event before scanning"
      );
      return;
    }

    const selectedEventData = events.find((e) => e.id === selectedEvent);

    // Clear previous scan result and stop any ongoing scanning to show camera
    currentScanResult = null;
    validTicketInfo = null;
    isScanning = false;
    
    confirmMode = "start";
    confirmDialogData = {
      title: "Start Scanning",
      message: `Are you sure you want to start scanning tickets for "${selectedEventData?.name}"?`,
      confirmText: "Start Scanning",
      confirmVariant: "success",
    };
    showConfirmDialog = true;
  }

  async function handleScanConfirm() {
    showConfirmDialog = false;
    if (confirmMode === "wallet" && pendingWalletAddress) {
      processWalletScan(pendingWalletAddress)
        .then(async ({ result }) => {
          if (result.success) {
            const ticketInfo = result.ticketInfo;
            currentScanResult = {
              success: true,
              message: result.message,
              guestName: ticketInfo.original_buyer_name || "Unknown",
              ticketType: ticketInfo.ticket_type_name || "Standard Ticket",
              section: "General Admission",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              ticketInfo: ticketInfo,
            };
            // Reload scan history from database
            if (selectedEvent) {
              await loadScanHistoryForEvent(selectedEvent);
            }
            showToast(
              "success",
              "Ticket Validated",
              `${ticketInfo.original_buyer_name} checked in successfully`
            );
          } else {
            // Format error message if it contains a timestamp
            let errorMessage = result.message;
            if (
              errorMessage &&
              errorMessage.includes("already checked in at")
            ) {
              // Try to format the timestamp in the message
              const timestampMatch = errorMessage.match(
                /already checked in at (.+)/
              );
              if (timestampMatch && timestampMatch[1]) {
                try {
                  const checkInDate = new Date(timestampMatch[1]);
                  const formattedDate = checkInDate.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  errorMessage = `This ticket has already been checked in on ${formattedDate}. Each ticket can only be used once.`;
                } catch (e) {
                  // If date parsing fails, use original message
                }
              }
            }
            currentScanResult = {
              success: false,
              message: errorMessage,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            // Don't add failed scans to history (only successful check-ins are stored)
            showToast("error", "Validation Failed", errorMessage);
          }
        })
        .finally(() => {
          pendingWalletAddress = null;
          confirmMode = "start";
          isScanning = false;
        });
    } else if (confirmMode === "guest" && pendingGuestId) {
      // Proceed with guest check-in after confirmation
      checkInGuest(pendingGuestId)
        .then(async (check) => {
          if (check.success) {
            const ticketInfo: any = {
              original_buyer_name: "Guest",
              ticket_type_name: "Ticket",
            };
            currentScanResult = {
              success: true,
              message: check.message || "Guest checked in successfully",
              guestName: ticketInfo.original_buyer_name,
              ticketType: ticketInfo.ticket_type_name,
              section: "General Admission",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              ticketInfo,
            };
            // Reload scan history from database
            if (selectedEvent) {
              await loadScanHistoryForEvent(selectedEvent);
            }
            showToast(
              "success",
              "Ticket Validated",
              `${ticketInfo.original_buyer_name} checked in successfully`
            );
          } else {
            currentScanResult = {
              success: false,
              message: check.error || "Guest not found or already checked in",
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
            // Don't add failed scans to history (only successful check-ins are stored)
            showToast("error", "Validation Failed", currentScanResult.message);
          }
        })
        .finally(() => {
          pendingGuestId = null;
          validTicketInfo = null;
          confirmMode = "start";
          isScanning = false;
        });
    } else {
      startScanning();
    }
  }

  function handleScanCancel() {
    showConfirmDialog = false;
  }

  function handleCheckInClick() {
    if (!validTicketInfo) return;

    if (validTicketInfo.type === "guest" && validTicketInfo.guestId) {
      // Show confirmation dialog for guest check-in
      pendingGuestId = validTicketInfo.guestId;
      confirmMode = "guest";
      confirmDialogData = {
        title: "Confirm Check-In",
        message: `Proceed to check in ${validTicketInfo.guestName}?`,
        confirmText: "Check In",
        confirmVariant: "success",
      };
      showConfirmDialog = true;
    } else if (validTicketInfo.type === "wallet" && validTicketInfo.walletAddress) {
      // Show confirmation dialog for wallet check-in
      pendingWalletAddress = validTicketInfo.walletAddress;
      confirmMode = "wallet";
      const ticketCount = validTicketInfo.unscannedCount || 1;
      confirmDialogData = {
        title:
          ticketCount > 1
            ? "Multiple Tickets Found"
            : "Confirm Check-In",
        message:
          ticketCount > 1
            ? `This wallet has ${ticketCount} unscanned tickets. Proceed to check in one?`
            : `Proceed to check in ${validTicketInfo.guestName}?`,
        confirmText: ticketCount > 1 ? "Check In One" : "Check In",
        confirmVariant: "success",
      };
      showConfirmDialog = true;
    }
  }

  function toggleManualInput() {
    showManualInput = !showManualInput;
    if (showManualInput) {
      manualWalletAddress = "";
    }
  }

  function handleManualSubmit() {
    if (manualWalletAddress.trim()) {
      handleScanResult(manualWalletAddress.trim());
      manualWalletAddress = "";
      showManualInput = false;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Header -->
  <div
    class="mb-8 transition-all duration-1000 transform {isLoaded
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <h1 class="text-3xl font-bold text-white mb-2">QR Code Scanner</h1>
    <p class="text-gray-400">Scan tickets and verify guest entry</p>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center min-h-64">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"
        ></div>
        <p class="text-gray-400">Loading events...</p>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-600 border border-red-500 rounded-lg p-6 mb-8">
      <div class="flex items-center">
        <svg
          class="w-6 h-6 text-red-400 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <h3 class="text-white font-semibold">Error Loading Events</h3>
          <p class="text-red-200 text-sm">{error}</p>
        </div>
      </div>
      <button
        on:click={loadEvents}
        class="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors duration-200"
      >
        Retry
      </button>
    </div>
  {:else if events.length === 0}
    <div class="bg-yellow-600 border border-yellow-500 rounded-lg p-6 mb-8">
      <div class="flex items-center">
        <svg
          class="w-6 h-6 text-yellow-400 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <h3 class="text-white font-semibold">No Active Events</h3>
          <p class="text-yellow-200 text-sm">
            There are no active events available for scanning.
          </p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Main Content Grid -->
    <div
      class="grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-1000 transform {showScanner
        ? 'translate-y-0 opacity-100'
        : 'translate-y-8 opacity-0'}"
    >
      <!-- Left Column - Scanner Controls -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Event Selector -->
        <EventSelector bind:selectedEvent />

        <!-- QR Scanner or Scan Result -->
        <div class="flex justify-center">
          {#if currentScanResult}
            <!-- Show scan result in place of camera -->
            <div class="w-80 min-h-80 bg-gray-800 border-2 border-cyan-400 rounded-lg overflow-hidden shadow-lg flex items-center justify-center p-6" style="box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);">
              {#if currentScanResult.success}
                {#if currentScanResult.isPending}
                  <!-- Valid Ticket - Pending Check-In -->
                  <div class="bg-cyan-600 border border-cyan-500 rounded-lg p-6 w-full">
                    <div class="flex items-center mb-4 justify-center">
                      <svg class="w-8 h-8 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"/>
                      </svg>
                      <h3 class="ml-2 text-white font-bold text-xl">Valid Ticket</h3>
                    </div>
                    <div class="space-y-3 text-white text-center mb-4">
                      <p class="font-semibold text-lg">{currentScanResult.guestName}</p>
                      <p class="text-cyan-100">
                        {currentScanResult.ticketType} - {currentScanResult.section}
                      </p>
                      <p class="text-cyan-200 text-sm">{currentScanResult.timestamp}</p>
                    </div>
                    <button
                      on:click={handleCheckInClick}
                      class="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Check In
                    </button>
                  </div>
                {:else}
                  <!-- Success Result (Already Checked In) -->
                  <div class="bg-green-600 border border-green-500 rounded-lg p-6 w-full">
                    <div class="flex items-center mb-4 justify-center">
                      <svg class="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      <h3 class="ml-2 text-white font-bold text-xl">Ticket Verified!</h3>
                    </div>
                    <div class="space-y-3 text-white text-center">
                      <p class="font-semibold text-lg">{currentScanResult.guestName}</p>
                      <p class="text-green-100">
                        {currentScanResult.ticketType} - {currentScanResult.section}
                      </p>
                      <p class="text-green-200 text-sm">{currentScanResult.timestamp}</p>
                    </div>
                  </div>
                {/if}
              {:else}
                <!-- Error Result -->
                <div class="bg-red-600 border border-red-500 rounded-lg p-6 w-full">
                  <div class="flex items-center mb-4 justify-center">
                    <svg class="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <h3 class="ml-2 text-white font-bold text-xl">Scan Failed</h3>
                  </div>
                  <div class="space-y-3 text-white text-center">
                    <p class="font-semibold text-base leading-relaxed">{currentScanResult.message}</p>
                    <p class="text-red-200 text-sm">{currentScanResult.timestamp}</p>
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <!-- Show camera scanner when no result -->
            <QRScanner {isScanning} onScan={handleScanResult} />
          {/if}
        </div>

        <!-- Scan Controls -->
        <div class="flex flex-col items-center space-y-4">
          <div class="flex justify-center space-x-4">
            <button
              on:click={showScanConfirmation}
              disabled={isScanning || !selectedEvent}
              class="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Start Scanning
            </button>
            <button
              on:click={stopScanning}
              disabled={!isScanning}
              class="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Stop Scanning
            </button>
          </div>

          <!-- Manual Input Toggle -->
          <button
            on:click={toggleManualInput}
            class="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            {showManualInput ? "Hide Manual Input" : "Manual Input"}
          </button>
        </div>

        <!-- Manual Input Section -->
        {#if showManualInput}
          <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-4">
            <h3 class="text-lg font-semibold text-white mb-4">
              Manual Wallet Address Input
            </h3>
            <div class="space-y-4">
              <div>
                <label
                  for="wallet-address"
                  class="block text-sm font-medium text-gray-300 mb-2"
                >
                  Wallet Address
                </label>
                <input
                  id="wallet-address"
                  type="text"
                  bind:value={manualWalletAddress}
                  placeholder="Enter wallet address (e.g., 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6)"
                  class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  on:keydown={(e) => e.key === "Enter" && handleManualSubmit()}
                />
              </div>

              <div class="flex space-x-3">
                <button
                  on:click={handleManualSubmit}
                  disabled={!manualWalletAddress.trim() || !selectedEvent}
                  class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Validate Ticket
                </button>
                <button
                  on:click={toggleManualInput}
                  class="px-4 py-2 bg-gray-600 text-gray-300 font-medium rounded-lg hover:bg-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Column - Scan History -->
      <div
        class="lg:col-span-1 transition-all duration-1000 transform {showHistory
          ? 'translate-x-0 opacity-100'
          : 'translate-x-8 opacity-0'}"
      >
        <ScanHistory {scanHistory} />
      </div>
    </div>
  {/if}

  <!-- Glowing particles background effect -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden">
    <div
      class="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 0s;"
    ></div>
    <div
      class="absolute top-1/3 right-1/3 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 1s;"
    ></div>
    <div
      class="absolute bottom-1/4 left-1/3 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 2s;"
    ></div>
    <div
      class="absolute bottom-1/3 right-1/4 w-1 h-1 bg-teal-400 rounded-full animate-pulse opacity-30"
      style="animation-delay: 0.5s;"
    ></div>
  </div>
</div>

<!-- Confirmation Dialog -->
<ConfirmationDialog
  bind:show={showConfirmDialog}
  title={confirmDialogData.title}
  message={confirmDialogData.message}
  confirmText={confirmDialogData.confirmText}
  confirmVariant={confirmDialogData.confirmVariant}
  on:confirm={handleScanConfirm}
  on:cancel={handleScanCancel}
/>

<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import BackButton from "$lib/components/BackButton.svelte";
  import GradientButton from "$lib/components/GradientButton.svelte";

  // Get token from URL params
  $: token = $page.params.token;
  
  let loading = true;
  let error: string | null = null;
  let ticketData: any = null;
  let showQRCode = false;
  let downloadCount = 0;

  // Mock ticket data for demonstration
  const mockTicketData = {
    eventName: "Amazing Tech Conference 2024",
    eventDate: "2024-02-15",
    eventLocation: "Convention Center, San Francisco",
    tickets: [
      {
        id: 1,
        type: "VIP Pass",
        price: 150,
        ticketNumber: "VIP-001-ABC123",
        qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WSVAtMDAxLUFCQzEyMzwvdGV4dD48L3N2Zz4="
      },
      {
        id: 2,
        type: "Standard Ticket",
        price: 75,
        ticketNumber: "STD-002-DEF456",
        qrCode: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TVEQtMDAyLURFRjQ1NjwvdGV4dD48L3N2Zz4="
      }
    ],
    totalAmount: 225,
    paymentHash: "pi_abc123xyz",
    paymentMethod: "card", // or "orange_money"
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };

  onMount(async () => {
    try {
      // Simulate loading ticket data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would fetch ticket data using the token
      // const response = await fetch(`/api/tickets/guest/${token}`);
      // ticketData = await response.json();
      
      ticketData = mockTicketData;
      loading = false;
    } catch (err) {
      error = "Failed to load ticket data";
      loading = false;
    }
  });

  function downloadTickets() {
    downloadCount++;
    
    // Create a simple PDF-like download
    const ticketContent = `
SOS SEATS - Your Tickets
========================

Event: ${ticketData.eventName}
Date: ${ticketData.eventDate}
Location: ${ticketData.eventLocation}

Tickets:
${ticketData.tickets.map(ticket => `
- ${ticket.type}: ${ticket.ticketNumber}
  Price: $${ticket.price}
`).join('')}

Total Paid: $${ticketData.totalAmount}
Payment ID: ${ticketData.paymentHash}

Access Token: ${token}
Expires: ${ticketData.expiresAt.toLocaleString()}

Thank you for using SOS SEATS!
    `.trim();

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tickets-${token}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleQRCode() {
    showQRCode = !showQRCode;
  }

  function connectWallet() {
    // Redirect to marketplace with wallet connection prompt
    goto('/marketplace?connect=wallet');
  }

  function goToMarketplace() {
    goto('/marketplace');
  }
</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Header -->
  <div class="bg-gradient-to-r from-[#18122B] via-[#232946] to-[#0A0A0A] border-b border-[#00F5FF]/20">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <BackButton />
        <h1 class="text-2xl font-bold bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent">
          Your Tickets
        </h1>
        <div class="w-8"></div> <!-- Spacer for centering -->
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-4xl mx-auto px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F5FF]"></div>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-400 text-lg mb-4">{error}</div>
        <GradientButton text="Back to Marketplace" onClick={goToMarketplace} />
      </div>
    {:else if ticketData}
      <!-- Success Message -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 p-4 bg-green-900/20 border border-green-500/30 rounded-lg mb-4">
          <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <span class="text-green-400 font-semibold">Payment Successful!</span>
        </div>
        <h2 class="text-3xl font-bold mb-2">{ticketData.eventName}</h2>
        <p class="text-gray-400">Your tickets are ready for download</p>
      </div>

      <!-- Event Details -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
        <h3 class="text-xl font-semibold mb-4">Event Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div class="text-sm text-gray-400">Date</div>
            <div class="text-white font-medium">{ticketData.eventDate}</div>
          </div>
          <div>
            <div class="text-sm text-gray-400">Location</div>
            <div class="text-white font-medium">{ticketData.eventLocation}</div>
          </div>
          <div>
            <div class="text-sm text-gray-400">Total Paid</div>
            <div class="text-white font-medium">${ticketData.totalAmount}</div>
          </div>
          <div>
            <div class="text-sm text-gray-400">Payment Method</div>
            <div class="text-white font-medium">
              {ticketData.paymentMethod === "orange_money" ? "Orange Money SL" : "Credit/Debit Card"}
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket Actions -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
        <h3 class="text-xl font-semibold mb-4">Your Tickets</h3>
        
        <!-- Download Section -->
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <GradientButton
              text="📥 Download Tickets"
              onClick={downloadTickets}
              icon="download"
              class_="flex-1"
            />
            <button
              on:click={toggleQRCode}
              class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {showQRCode ? '📱 Hide QR Codes' : '📱 Show QR Codes'}
            </button>
          </div>
          
          {#if downloadCount > 0}
            <p class="text-sm text-gray-400 mt-2">
              Downloaded {downloadCount} time{downloadCount > 1 ? 's' : ''}
            </p>
          {/if}
        </div>

        <!-- QR Code Display -->
        {#if showQRCode}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each ticketData.tickets as ticket: any}
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="text-center">
                  <div class="text-sm text-gray-400 mb-2">{ticket.type}</div>
                  <div class="text-xs text-gray-500 mb-3">{ticket.ticketNumber}</div>
                  <img src={ticket.qrCode} alt="QR Code" class="mx-auto w-24 h-24 bg-white rounded" />
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Ticket List -->
        <div class="mt-6 space-y-3">
          {#each ticketData.tickets as ticket: any}
            <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <div class="font-medium">{ticket.type}</div>
                <div class="text-sm text-gray-400">{ticket.ticketNumber}</div>
              </div>
              <div class="text-right">
                <div class="font-medium">${ticket.price}</div>
                <div class="text-sm text-green-400">✓ Confirmed</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Web3 Upgrade Section -->
      <div class="bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] border border-[#9D4EDD]/30 rounded-xl p-6 mb-6">
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-2 bg-gradient-to-r from-[#9D4EDD] to-[#00F5FF] bg-clip-text text-transparent">
            Want Web3 Benefits?
          </h3>
          <p class="text-gray-300 mb-4">
            Connect your wallet to unlock transferable tickets, lower fees, and true ownership.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <GradientButton
              text="🔗 Connect Wallet"
              onClick={connectWallet}
              icon="wallet"
              class_="bg-gradient-to-r from-[#9D4EDD] to-[#00F5FF] hover:from-[#9D4EDD]/90 hover:to-[#00F5FF]/90"
            />
            <button
              on:click={goToMarketplace}
              class="px-6 py-3 text-gray-400 hover:text-white transition-colors duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      <!-- Access Information -->
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-lg font-semibold mb-4">Access Information</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Access Token:</span>
            <span class="font-mono text-[#00F5FF]">{token}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Payment ID:</span>
            <span class="font-mono text-gray-300">{ticketData.paymentHash}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Expires:</span>
            <span class="text-gray-300">{ticketData.expiresAt.toLocaleString()}</span>
          </div>
        </div>
        <div class="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-xs text-yellow-400">Save this page or download your tickets before the access expires.</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

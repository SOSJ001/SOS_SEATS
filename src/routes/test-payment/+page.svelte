<script lang="ts">
  import { onMount } from "svelte";
  import { walletStore, web3UserStore } from "$lib/store";
  import {
    purchaseTicketsWithSolana,
    sendTransactionWithWallet,
    getBalance,
  } from "$lib/web3";
  import GradientButton from "$lib/components/GradientButton.svelte";

  // Wallet connection state
  $: connectedWalletAddress = $walletStore?.address || null;
  $: web3User = $web3UserStore?.user || null;

  let walletBalance = 0;
  let loadingBalance = false;
  let processingPayment = false;
  let paymentResult: any = null;

  async function checkWalletBalance() {
    if (!connectedWalletAddress) return;

    loadingBalance = true;
    try {
      const balance = await getBalance(connectedWalletAddress);
      walletBalance = balance || 0;
    } catch (error) {
      console.error("Error getting balance:", error);
    } finally {
      loadingBalance = false;
    }
  }

  async function testPayment() {
    if (!connectedWalletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    processingPayment = true;
    paymentResult = null;

    try {
      // Test purchase of 1 ticket for 0.01 SOL
      const purchaseResult = await purchaseTicketsWithSolana(
        connectedWalletAddress,
        1, // 1 ticket
        0.01 // 0.01 SOL per ticket
      );

      if (!purchaseResult.success) {
        throw new Error(purchaseResult.error);
      }

      // Show transaction details
      paymentResult = {
        type: "transaction_created",
        data: purchaseResult,
      };

      // Ask user if they want to proceed with the transaction
      const confirmed = confirm(
        `Transaction created successfully!\n\n` +
          `From: ${purchaseResult.fromWalletAddress?.slice(0, 6)}...${purchaseResult.fromWalletAddress?.slice(-4)}\n` +
          `To: ${purchaseResult.receivingWalletAddress?.slice(0, 6)}...${purchaseResult.receivingWalletAddress?.slice(-4)}\n` +
          `Amount: ${purchaseResult.totalAmount} SOL\n` +
          `Tickets: ${purchaseResult.ticketQuantity}\n\n` +
          `Do you want to send this transaction?`
      );

      if (confirmed && purchaseResult.transaction) {
        // Send the transaction
        const sendResult = await sendTransactionWithWallet(
          purchaseResult.transaction as any
        );

        if (sendResult.success) {
          paymentResult = {
            type: "transaction_sent",
            data: {
              ...purchaseResult,
              signature: sendResult.signature,
              confirmation: sendResult.confirmation,
            },
          };
        } else {
          throw new Error(sendResult.error);
        }
      }
    } catch (error: any) {
      paymentResult = {
        type: "error",
        error: error.message,
      };
    } finally {
      processingPayment = false;
    }
  }

  onMount(() => {
    if (connectedWalletAddress) {
      checkWalletBalance();
    }
  });

  $: if (connectedWalletAddress) {
    checkWalletBalance();
  }
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">Blockchain Payment Test</h1>

    <!-- Wallet Status -->
    <div class="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Wallet Status</h2>

      {#if connectedWalletAddress}
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-300">Connected:</span>
            <span class="text-green-400 font-mono">
              {connectedWalletAddress.slice(
                0,
                6
              )}...{connectedWalletAddress.slice(-4)}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-300">Balance:</span>
            <span class="text-blue-400">
              {loadingBalance
                ? "Loading..."
                : `${walletBalance.toFixed(4)} SOL`}
            </span>
          </div>

          {#if web3User}
            <div class="flex justify-between">
              <span class="text-gray-300">User:</span>
              <span class="text-purple-400">
                {web3User.display_name || web3User.username || "Web3 User"}
              </span>
            </div>
          {/if}
        </div>
      {:else}
        <div class="text-yellow-400">
          No wallet connected. Please connect your wallet to test payments.
        </div>
      {/if}
    </div>

    <!-- Payment Test -->
    <div class="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Payment Test</h2>

      <div class="space-y-4">
        <div class="bg-gray-700 rounded p-4">
          <h3 class="font-semibold mb-2">Test Parameters</h3>
          <div class="space-y-1 text-sm">
            <div>• Tickets: 1</div>
            <div>• Price per ticket: 0.01 SOL</div>
            <div>• Total: 0.01 SOL</div>
            <div>
              • Receiving wallet: HDCrEYrGwPBP2rqX1G7TqChzkN6ckRSpJBVF1YT1YPSF
            </div>
          </div>
        </div>

        <GradientButton
          text={processingPayment ? "Processing..." : "Test Payment"}
          onClick={testPayment}
          icon={processingPayment ? "loading" : "wallet"}
          class_="w-full"
          disabled={!connectedWalletAddress || processingPayment}
        />
      </div>
    </div>

    <!-- Payment Result -->
    {#if paymentResult}
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Payment Result</h2>

        {#if paymentResult.type === "transaction_created"}
          <div class="bg-blue-900/30 border border-blue-500 rounded p-4">
            <h3 class="text-green-400 font-semibold mb-2">
              ✅ Transaction Created
            </h3>
            <div class="space-y-2 text-sm">
              <div>
                <strong>From:</strong>
                {paymentResult.data.fromWalletAddress}
              </div>
              <div>
                <strong>To:</strong>
                {paymentResult.data.receivingWalletAddress}
              </div>
              <div>
                <strong>Amount:</strong>
                {paymentResult.data.totalAmount} SOL
              </div>
              <div>
                <strong>Tickets:</strong>
                {paymentResult.data.ticketQuantity}
              </div>
            </div>
          </div>
        {:else if paymentResult.type === "transaction_sent"}
          <div class="bg-green-900/30 border border-green-500 rounded p-4">
            <h3 class="text-green-400 font-semibold mb-2">
              🎉 Payment Successful!
            </h3>
            <div class="space-y-2 text-sm">
              <div>
                <strong>Transaction:</strong>
                {paymentResult.data.signature}
              </div>
              <div>
                <strong>Amount:</strong>
                {paymentResult.data.totalAmount} SOL
              </div>
              <div>
                <strong>Tickets:</strong>
                {paymentResult.data.ticketQuantity}
              </div>
              <div><strong>Status:</strong> Confirmed</div>
            </div>
          </div>
        {:else if paymentResult.type === "error"}
          <div class="bg-red-900/30 border border-red-500 rounded p-4">
            <h3 class="text-red-400 font-semibold mb-2">❌ Payment Failed</h3>
            <div class="text-red-300">{paymentResult.error}</div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

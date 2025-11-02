<script lang="ts">
  import WalletBalance from "$lib/components/WalletBalance.svelte";
  import PortfolioOverview from "$lib/components/PortfolioOverview.svelte";
  import RecentTransactions from "$lib/components/RecentTransactions.svelte";
  import NetworkStatus from "$lib/components/NetworkStatus.svelte";
  import { onMount, onDestroy } from "svelte";
  import { supabase, verifyWeb3Session, loadUserEvents } from "$lib/supabase";
  import {
    getBalance,
    getActiveWalletAddress,
    signMessageWithWallet,
  } from "$lib/web3";
  import { sessionFromDb, showToast } from "$lib/store";
  import MaintenanceWrapper from "$lib/components/MaintenanceWrapper.svelte";
  import { monimeService } from "$lib/monime";
  import { calculateWithdrawalFee } from "$lib/orangeMoneyPayment";
  import MultisigSettings from "$lib/components/MultisigSettings.svelte";
  import PendingWithdrawalCard from "$lib/components/PendingWithdrawalCard.svelte";

  export const data = undefined;

  // Animation states
  let isLoaded = false;
  let showContent = false;

  // Dynamic balances
  let solBalance: string | null = null; // on-chain SOL balance (optional)
  let mobileMoneyTotal: number = 0;
  let solanaOrdersTotal: number = 0;
  let totalRevenue: number = 0;
  let totalDisplay: string = "--";
  let recentTx: any[] = [];

  // Loading states
  let isLoadingMobileMoney = true;
  let isLoadingSolana = true;
  let isLoadingTotal = true;
  let isLoadingTransactions = true;
  let isLoadingSolBalance = true;
  let isWithdrawing = false;
  // Wallet address state
  let currentWalletAddress: string | null = null;
  // Pending withdrawals state
  let pendingWithdrawals: any[] = [];
  let isLoadingPendingWithdrawals = true;
  // Withdrawal modal state
  let showWithdrawalModal = false;
  let withdrawalPhoneNumber = "";
  let withdrawalProvider: "orange_money" | "afrimoney" = "orange_money";

  // Get current wallet address
  async function getCurrentWallet(): Promise<string | null> {
    try {
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }
      return wallet;
    } catch (err) {
      console.error("Error getting wallet:", err);
      return null;
    }
  }

  // Calculated withdrawal fees (reactive)
  $: withdrawalFeeDetails = calculateWithdrawalFee(mobileMoneyTotal);
  $: withdrawalPlatformFee = withdrawalFeeDetails.platformFee;
  $: estimatedMonimeFee = withdrawalFeeDetails.monimeFee;
  $: withdrawalTotalFees = withdrawalFeeDetails.totalFees;
  $: withdrawalNetAfterPlatformFee =
    withdrawalFeeDetails.netAmountAfterPlatformFee;
  $: withdrawalNetAmount = withdrawalFeeDetails.netAmount;

  function openWithdrawalModal() {
    showWithdrawalModal = true;
    withdrawalPhoneNumber = "";
    withdrawalProvider = "orange_money";
  }

  function closeWithdrawalModal() {
    showWithdrawalModal = false;
    withdrawalPhoneNumber = "";
  }

  async function handleWithdrawMobileMoney() {
    if (mobileMoneyTotal <= 0 || isWithdrawing) return;

    // Get user ID from session store
    const userId = $sessionFromDb;
    if (!userId) {
      showToast("error", "Login Required", "Please log in to withdraw.", 5000);
      return;
    }

    const session = await verifyWeb3Session();
    let wallet =
      session?.success && session.user?.wallet_address
        ? session.user.wallet_address
        : null;
    if (!wallet) {
      wallet = getActiveWalletAddress();
    }
    if (!wallet) {
      showToast(
        "error",
        "Wallet Not Connected",
        "Please connect your wallet to withdraw.",
        5000
      );
      return;
    }

    // Validate phone number
    const phoneNumber = withdrawalPhoneNumber.trim();
    if (!phoneNumber) {
      showToast(
        "error",
        "Phone Number Required",
        "Please enter your mobile money phone number.",
        5000
      );
      return;
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    isWithdrawing = true;

    try {
      // Get currency from latest mobile money order for events created by this user
      let currency = "NLe"; // Default to NLe for mobile money
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      if (eventIds.length > 0) {
        const { data: mmOrder } = await supabase
          .from("orders")
          .select("currency")
          .in("event_id", eventIds)
          .in("payment_method", ["orange_money", "afrimoney"])
          .in("payment_status", ["paid", "completed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mmOrder?.currency) currency = mmOrder.currency;
      }

      // Calculate withdrawal fees
      const feeDetails = calculateWithdrawalFee(mobileMoneyTotal);
      const platformFee = feeDetails.platformFee;
      const monimeFee = feeDetails.monimeFee;
      const netAmountAfterPlatformFee = feeDetails.netAmountAfterPlatformFee;
      const finalNetAmount = feeDetails.netAmount; // Final amount user receives (after both fees)

      // Validate net amount is sufficient
      if (finalNetAmount <= 0) {
        showToast(
          "error",
          "Insufficient Amount",
          "Withdrawal amount is too small after fees. Please try a larger amount.",
          6000
        );
        isWithdrawing = false;
        return;
      }

      // Request wallet signature for withdrawal authorization
      const withdrawalMessage = `Authorize withdrawal of ${currency} ${finalNetAmount.toFixed(2)} to ${formattedPhone} via ${withdrawalProvider}\n\nAmount: ${currency} ${mobileMoneyTotal.toFixed(2)}\nPlatform Fee: ${currency} ${platformFee.toFixed(2)}\nProcessing Fee: ${currency} ${estimatedMonimeFee.toFixed(2)}\nNet Amount: ${currency} ${finalNetAmount.toFixed(2)}\n\nTimestamp: ${new Date().toISOString()}\nWallet: ${wallet}`;

      const signResult = await signMessageWithWallet(withdrawalMessage);

      if (!signResult.success || !signResult.signature) {
        showToast(
          "error",
          "Signature Failed",
          signResult.error ||
            "Failed to sign withdrawal authorization. Please try again.",
          6000
        );
        isWithdrawing = false;
        return;
      }

      // Convert signature to base64 for storage
      const signatureBase64 = Array.from(signResult.signature)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const signatureBase64Encoded = btoa(signatureBase64);

      // Check if multisig is enabled for this wallet
      const { data: multisigConfig } = await supabase.rpc(
        "get_multisig_config",
        {
          p_wallet_address: wallet,
        }
      );

      const isMultisigEnabled =
        multisigConfig &&
        multisigConfig.length > 0 &&
        multisigConfig[0].is_enabled === true;

      if (isMultisigEnabled) {
        // MULTISIG FLOW: Create pending withdrawal
        const pendingToken = `wd_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create pending withdrawal record
        const { data: pendingWithdrawal, error: pendingError } = await supabase
          .from("wallet_transactions")
          .insert([
            {
              wallet_address: wallet,
              type: "withdrawal",
              source: "mobile_money",
              amount: -Number(mobileMoneyTotal || 0),
              currency: currency,
              status: "pending_approval",
              multisig_enabled: true,
              required_signatures: multisigConfig[0].required_signatures,
              collected_signatures: [
                {
                  wallet: wallet,
                  signature: signatureBase64Encoded,
                  public_key: signResult.publicKey || wallet,
                  signed_at: new Date().toISOString(),
                },
              ],
              pending_token: pendingToken,
              expires_at: expiresAt.toISOString(),
              metadata: {
                note: "Multi-signature withdrawal pending approval",
                provider: withdrawalProvider,
                phone_number: formattedPhone,
                gross_amount: mobileMoneyTotal,
                platform_fee: platformFee,
                estimated_monime_fee: monimeFee,
                net_amount_after_platform_fee: netAmountAfterPlatformFee,
                final_net_amount: finalNetAmount,
                fees_breakdown: {
                  platform_fee: platformFee,
                  estimated_monime_fee: monimeFee,
                  total_fees: platformFee + monimeFee,
                },
                wallet_signature: {
                  message: withdrawalMessage,
                  signature: signatureBase64Encoded,
                  public_key: signResult.publicKey,
                  signed_at: new Date().toISOString(),
                },
                user_id: userId,
              },
            },
          ])
          .select()
          .single();

        if (pendingError) {
          console.error("Error creating pending withdrawal:", pendingError);
          showToast(
            "error",
            "Error",
            "Failed to create pending withdrawal. Please try again.",
            6000
          );
          isWithdrawing = false;
          return;
        }

        // Send notifications to all authorized signers
        const signers = multisigConfig[0].signers || [];
        const notificationPromises = [];

        for (const signer of signers) {
          if (signer.is_active && signer.signer_wallet_address !== wallet) {
            notificationPromises.push(
              supabase.from("notifications").insert([
                {
                  user_wallet_address: signer.signer_wallet_address,
                  title: "Withdrawal Signature Required",
                  message: `A withdrawal of ${currency} ${finalNetAmount.toFixed(2)} to ${formattedPhone} needs your signature.`,
                  type: "warning",
                  action_url: `/dashboard/wallet/pending-withdrawal/${pendingToken}`,
                  is_read: false,
                },
              ])
            );
          }
        }

        // Send all notifications
        await Promise.all(notificationPromises);

        // Close modal and show success message
        closeWithdrawalModal();
        showToast(
          "info",
          "Withdrawal Pending",
          `Waiting for ${multisigConfig[0].required_signatures - 1} more signature(s). Notifications sent to authorized signers.`,
          8000
        );

        // Refresh balances and transactions
        await loadMobileMoneyTotal();
        await loadRecentTransactions();
        await loadPendingWithdrawals();
        isWithdrawing = false;
        return;
      }

      // STANDARD FLOW: Execute withdrawal immediately
      // Map provider to Monime provider code
      const providerCode =
        withdrawalProvider === "orange_money" ? "m17" : "m18";

      // Create payout via Monime API (send amount after platform fee - Monime will deduct their 1% fee)
      const payout = await monimeService.createPayout(
        {
          currency: currency,
          value: netAmountAfterPlatformFee, // Send amount after platform fee (Monime will deduct their 1% from this)
        },
        {
          providerCode: providerCode,
          accountId: formattedPhone,
        },
        undefined, // source (optional)
        {
          wallet_address: wallet,
          user_id: userId,
          withdrawal_type: "mobile_money",
          gross_amount: mobileMoneyTotal,
          platform_fee: platformFee,
          estimated_monime_fee: monimeFee,
          net_amount_after_platform_fee: netAmountAfterPlatformFee,
          final_net_amount: finalNetAmount,
        },
        `withdrawal_${Date.now()}_${wallet}`
      );

      // Calculate total fees (platform fee + Monime fees)
      const monimeFees =
        payout.fees?.reduce((sum: number, fee: any) => {
          const feeValue =
            typeof fee.amount?.value === "number"
              ? fee.amount.value / 100 // Convert from cents
              : parseFloat(fee.amount?.value || 0) / 100;
          return sum + feeValue;
        }, 0) || 0;

      // Create withdrawal record in wallet_transactions with payout details
      const { error } = await supabase.from("wallet_transactions").insert([
        {
          wallet_address: wallet,
          type: "withdrawal",
          source: "mobile_money",
          amount: -Number(mobileMoneyTotal || 0), // Deduct full amount from balance
          currency: currency,
          status: payout.status === "completed" ? "completed" : "pending",
          external_id: payout.id,
          metadata: {
            note: "User-initiated withdrawal from wallet page",
            payout_id: payout.id,
            payout_status: payout.status,
            provider: withdrawalProvider,
            phone_number: formattedPhone,
            gross_amount: mobileMoneyTotal,
            platform_fee: platformFee,
            monime_fees: monimeFees,
            estimated_monime_fee: monimeFee,
            net_amount_after_platform_fee: netAmountAfterPlatformFee,
            final_net_amount: finalNetAmount,
            fees_breakdown: {
              platform_fee: platformFee,
              estimated_monime_fee: monimeFee,
              actual_monime_fees: monimeFees,
              total_fees: platformFee + (monimeFees || monimeFee),
            },
            wallet_signature: {
              message: withdrawalMessage,
              signature: signatureBase64Encoded,
              public_key: signResult.publicKey,
              signed_at: new Date().toISOString(),
            },
            monime_response: payout,
          },
        },
      ]);

      if (error) {
        console.error("Error creating withdrawal record:", error);
        showToast(
          "error",
          "Record Save Failed",
          "Withdrawal initiated but failed to save record. Please contact support.",
          8000
        );
        return;
      }

      // Close modal and refresh
      closeWithdrawalModal();
      const actualMonimeFee = monimeFees || monimeFee; // Use actual from Monime if available, otherwise use estimate
      const feesInfo =
        platformFee > 0 || actualMonimeFee > 0
          ? ` (Platform Fee: ${platformFee.toFixed(2)}, Monime Fee: ${actualMonimeFee.toFixed(2)})`
          : "";

      if (payout.status === "completed") {
        showToast(
          "success",
          "Withdrawal Successful",
          `${currency} ${finalNetAmount.toFixed(2)} has been sent to ${formattedPhone}.${feesInfo}`,
          8000
        );
      } else {
        showToast(
          "info",
          "Withdrawal Submitted",
          `Status: ${payout.status}. You'll be notified when it completes. Amount to receive: ${currency} ${finalNetAmount.toFixed(2)}${feesInfo}`,
          10000
        );
      }

      // Refresh balances and transactions
      await loadMobileMoneyTotal();
      await loadRecentTransactions();
      await loadPendingWithdrawals();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      const errorMessage =
        error.message || "Failed to process withdrawal. Please try again.";
      showToast("error", "Withdrawal Failed", errorMessage, 8000);
    } finally {
      isWithdrawing = false;
    }
  }

  async function loadMobileMoneyTotal() {
    isLoadingMobileMoney = true;
    try {
      // Get user ID from session store (same as dashboard)
      const userId = $sessionFromDb;

      if (!userId) {
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      // Get wallet address for withdrawals
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      if (eventIds.length === 0) {
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      // Step 1: Calculate total deposits from completed mobile money orders
      const { data: rows, error } = await supabase
        .from("orders")
        .select("total_amount,payment_status,payment_method")
        .in("event_id", eventIds)
        .in("payment_method", ["orange_money", "afrimoney"])
        .in("payment_status", ["paid", "completed"]);

      if (error) {
        console.error("Error loading mobile money orders:", error);
        mobileMoneyTotal = 0;
        isLoadingMobileMoney = false;
        return;
      }

      // Sum all deposits (orders = deposits)
      const totalDeposits = (rows || []).reduce((sum: number, r: any) => {
        const amt =
          typeof r.total_amount === "string"
            ? parseFloat(r.total_amount)
            : r.total_amount || 0;
        return sum + (isFinite(amt) ? amt : 0);
      }, 0);

      // Step 2: Calculate total withdrawals from wallet_transactions
      // (withdrawals are stored as negative amounts, so we sum them to get total withdrawn)
      let totalWithdrawals = 0;
      if (wallet) {
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from("wallet_transactions")
          .select("amount, source, type, status")
          .eq("wallet_address", wallet)
          .in("source", ["mobile_money", "orange_money", "afrimoney"])
          .eq("type", "withdrawal")
          .in("status", ["completed", "pending", "paid"]);

        if (withdrawalsError) {
          console.error("Error loading withdrawals:", withdrawalsError);
        } else if (withdrawals && withdrawals.length > 0) {
          // Sum withdrawals (they're already negative, so we need to make them positive to get total withdrawn)
          totalWithdrawals = withdrawals.reduce((sum: number, t: any) => {
            const amt =
              typeof t.amount === "string"
                ? parseFloat(t.amount)
                : t.amount || 0;
            // Withdrawals are negative, so we take absolute value to get total withdrawn
            return sum + Math.abs(isFinite(amt) ? amt : 0);
          }, 0);
        }
      }

      // Step 3: Calculate balance = deposits - withdrawals
      mobileMoneyTotal = Math.max(0, totalDeposits - totalWithdrawals);
    } catch (err) {
      console.error("Error in loadMobileMoneyTotal:", err);
      mobileMoneyTotal = 0;
    } finally {
      isLoadingMobileMoney = false;
    }
  }

  async function loadOrderTotals() {
    isLoadingSolana = true;
    isLoadingTotal = true;
    try {
      // Get user ID from session store (same as dashboard)
      const userId = $sessionFromDb;

      if (!userId) {
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        isLoadingSolana = false;
        isLoadingTotal = false;
        return;
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      if (eventIds.length === 0) {
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal || 0;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        isLoadingSolana = false;
        isLoadingTotal = false;
        return;
      }

      // Query orders for events created by this user
      const { data: rows, error } = await supabase
        .from("orders")
        .select("total_amount, payment_method, payment_status")
        .in("event_id", eventIds)
        .in("payment_status", ["paid", "completed"]);

      if (error) {
        console.error("Error loading order totals:", error);
        solanaOrdersTotal = 0;
        totalRevenue = mobileMoneyTotal || 0;
        totalDisplay = totalRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        isLoadingSolana = false;
        isLoadingTotal = false;
        return;
      }

      const sumBy = (method: string) =>
        (rows || [])
          .filter((r: any) => r.payment_method === method)
          .reduce((sum: number, r: any) => {
            const amt =
              typeof r.total_amount === "string"
                ? parseFloat(r.total_amount)
                : r.total_amount || 0;
            return sum + (isFinite(amt) ? amt : 0);
          }, 0);

      solanaOrdersTotal = sumBy("solana");
      // mobileMoneyTotal already computed separately; ensure not double work
      if (mobileMoneyTotal === 0) {
        // Sum both orange_money and afrimoney for mobile money total
        mobileMoneyTotal = sumBy("orange_money") + sumBy("afrimoney");
      }
      totalRevenue = (solanaOrdersTotal || 0) + (mobileMoneyTotal || 0);
      totalDisplay = totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch (err) {
      console.error("Error in loadOrderTotals:", err);
      totalRevenue = mobileMoneyTotal || 0;
      totalDisplay = totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } finally {
      isLoadingSolana = false;
      isLoadingTotal = false;
    }
  }

  async function loadRecentTransactions() {
    isLoadingTransactions = true;
    try {
      // Get user ID from session store (same as balances)
      const userId = $sessionFromDb;
      if (!userId) {
        recentTx = [];
        isLoadingTransactions = false;
        return;
      }

      // Load events created by this user
      const userEvents = await loadUserEvents(userId, "traditional");
      const eventIds = userEvents.map((e: any) => e.id);

      // Get wallet address for wallet_transactions
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }

      // Query revenue orders (orders for events created by this user)
      let fromOrders: any[] = [];
      if (eventIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, created_at, total_amount, currency, payment_method, payment_status, order_number, events(name)"
          )
          .in("event_id", eventIds)
          .in("payment_status", ["paid", "completed"])
          .order("created_at", { ascending: false })
          .limit(10);

        if (ordersError) {
          console.error("Error loading revenue orders:", ordersError);
        } else {
          fromOrders = (orders || []).map((o: any) => {
            // Normalize currency for display - use "NLe" for mobile money, keep original for Web3
            const displayCurrency =
              o.payment_method === "orange_money" ||
              o.payment_method === "afrimoney"
                ? "NLe"
                : o.currency || "";

            return {
              id: o.id,
              type: o.payment_method,
              description: `${o.payment_method === "orange_money" || o.payment_method === "afrimoney" ? "Mobile Money" : "Web3"}: ${o.events?.name || "Event"} #${o.order_number}`,
              date: new Date(o.created_at).toLocaleString(),
              amount:
                `+ ${Number(o.total_amount || 0).toFixed(2)} ${displayCurrency}`.trim(),
              status: o.payment_status || "completed",
              icon:
                o.payment_method === "orange_money" ||
                o.payment_method === "afrimoney"
                  ? "deposit"
                  : "ticket",
            };
          });
        }
      }

      // Query wallet_transactions (withdrawals, deposits)
      let fromLedger: any[] = [];
      if (wallet) {
        const { data: ledger, error: ledgerError } = await supabase
          .from("wallet_transactions")
          .select(
            "id, created_at, amount, currency, type, source, status, external_id"
          )
          .eq("wallet_address", wallet)
          .order("created_at", { ascending: false })
          .limit(10);

        if (ledgerError) {
          console.error("Error loading wallet transactions:", ledgerError);
        } else {
          fromLedger = (ledger || []).map((t: any) => {
            // Normalize currency for display - use "NLe" for mobile money transactions
            const displayCurrency =
              t.source === "mobile_money" ||
              t.source === "orange_money" ||
              t.source === "afrimoney"
                ? "NLe"
                : t.currency || "";

            return {
              id: t.id,
              type: t.type,
              description: `${t.type === "withdrawal" ? "Withdrawal" : t.type === "deposit" ? "Deposit" : t.type}: ${t.source}`,
              date: new Date(t.created_at).toLocaleString(),
              amount:
                `${t.amount >= 0 ? "+ " : ""}${Number(t.amount || 0).toFixed(2)} ${displayCurrency}`.trim(),
              status: t.status || "pending",
              icon:
                t.type === "withdrawal"
                  ? "withdrawal"
                  : t.type === "deposit"
                    ? "deposit"
                    : "ticket",
            };
          });
        }
      }

      // Combine and sort by date (most recent first)
      recentTx = [...fromLedger, ...fromOrders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    } catch (err) {
      console.error("Error in loadRecentTransactions:", err);
      recentTx = [];
    } finally {
      isLoadingTransactions = false;
    }
  }

  async function loadPendingWithdrawals() {
    isLoadingPendingWithdrawals = true;
    try {
      const session = await verifyWeb3Session();
      let wallet =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!wallet) {
        wallet = getActiveWalletAddress();
      }

      if (!wallet) {
        pendingWithdrawals = [];
        isLoadingPendingWithdrawals = false;
        return;
      }

      // Load pending withdrawals for this wallet
      const { data: pending, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_address", wallet)
        .eq("type", "withdrawal")
        .eq("status", "pending_approval")
        .eq("multisig_enabled", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading pending withdrawals:", error);
        pendingWithdrawals = [];
      } else {
        // Filter out expired withdrawals
        const now = new Date();
        pendingWithdrawals = (pending || []).filter((w: any) => {
          if (!w.expires_at) return true;
          return new Date(w.expires_at) > now;
        });
      }

      // Ensure notifications exist for pending withdrawals that need signers
      await ensurePendingWithdrawalNotifications(wallet);
    } catch (err) {
      console.error("Error in loadPendingWithdrawals:", err);
      pendingWithdrawals = [];
    } finally {
      isLoadingPendingWithdrawals = false;
    }
  }

  // Ensure notifications exist for pending withdrawals that need signers
  async function ensurePendingWithdrawalNotifications(currentWallet: string) {
    try {

      // Find all pending withdrawals where this wallet is a potential signer
      // Use the security definer function to bypass RLS
      const { data: signerConfigs, error: signerError } = await supabase.rpc(
        "get_multisig_signers_by_signer_wallet",
        {
          p_signer_wallet_address: currentWallet,
        }
      );

      if (signerError) {
        console.error("Error fetching signer configs:", signerError);
        return;
      }

      if (!signerConfigs || signerConfigs.length === 0) {
        return;
      }
      const primaryWallets = (signerConfigs || []).map(
        (c: any) => c.primary_wallet_address
      );

      // Find pending withdrawals for these primary wallets
      const { data: pendingWithdrawals, error: withdrawalError } =
        await supabase
          .from("wallet_transactions")
          .select("*")
          .in("wallet_address", primaryWallets)
          .eq("type", "withdrawal")
          .eq("status", "pending_approval")
          .eq("multisig_enabled", true);

      if (withdrawalError) {
        console.error("Error fetching pending withdrawals:", withdrawalError);
        return;
      }

      if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
        return;
      }

      let notificationsCreated = 0;

      // Check each pending withdrawal and create notifications if needed
      for (const withdrawal of pendingWithdrawals) {
        // Check if withdrawal is expired
        if (
          withdrawal.expires_at &&
          new Date(withdrawal.expires_at) < new Date()
        ) {
          continue;
        }

        // Check if this wallet has already signed
        const collectedSignatures = withdrawal.collected_signatures || [];
        const hasSigned = collectedSignatures.some(
          (sig: any) => sig.wallet === currentWallet
        );

        if (hasSigned) {
          continue;
        }

        // Check if notification already exists (regardless of read status)
        const { data: existingNotifications, error: notifCheckError } =
          await supabase
            .from("notifications")
            .select("id")
            .eq("user_wallet_address", currentWallet)
            .eq(
              "action_url",
              `/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`
            )
            .limit(1);

        if (notifCheckError) {
          console.error(
            "Error checking existing notifications:",
            notifCheckError
          );
          continue;
        }

        if (existingNotifications && existingNotifications.length > 0) {
          continue;
        }

        // Create notification for this pending withdrawal
        const metadata = withdrawal.metadata || {};
        const finalAmount =
          metadata.final_net_amount || Math.abs(withdrawal.amount);
        const currency = withdrawal.currency || "NLe";
        const phoneNumber = metadata.phone_number || "N/A";

        const { data: notificationData, error: insertError } = await supabase.rpc(
          "create_notification",
          {
            p_user_wallet_address: currentWallet,
            p_title: "Withdrawal Signature Required",
            p_message: `A withdrawal of ${currency} ${finalAmount.toFixed(2)} to ${phoneNumber} needs your signature.`,
            p_type: "warning",
            p_action_url: `/dashboard/wallet/pending-withdrawal/${withdrawal.pending_token}`,
            p_is_read: false,
          }
        );

        if (insertError) {
          console.error("Error creating notification:", insertError);
        } else {
          notificationsCreated++;
        }
      }

      if (notificationsCreated > 0) {
        // Trigger a refresh of notifications in the UI (they auto-refresh every 30s, but this helps)
        // We could dispatch an event here if needed, but the auto-refresh should catch it
      }
    } catch (err) {
      console.error("Error ensuring pending withdrawal notifications:", err);
    }
  }

  // Handle Escape key to close modal
  function handleEscapeKey(e: KeyboardEvent) {
    if (e.key === "Escape" && showWithdrawalModal) {
      closeWithdrawalModal();
    }
  }

  onMount(() => {
    // Trigger entrance animations
    setTimeout(() => {
      isLoaded = true;
    }, 100);

    setTimeout(() => {
      showContent = true;
    }, 300);

    // Add Escape key listener for modal
    window.addEventListener("keydown", handleEscapeKey);

    // Load balances and wallet address
    (async () => {
      // Get wallet address first - retry a few times if not found immediately
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts && !currentWalletAddress) {
        currentWalletAddress = await getCurrentWallet();
        if (!currentWalletAddress && attempts < maxAttempts - 1) {
          // Wait a bit before retrying (wallet extension might need time to load)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempts + 1))
          );
        }
        attempts++;
      }

      // Get wallet address first for notification checking
      const session = await verifyWeb3Session();
      let walletForNotifications =
        session?.success && session.user?.wallet_address
          ? session.user.wallet_address
          : null;
      if (!walletForNotifications) {
        walletForNotifications = getActiveWalletAddress();
      }

      await Promise.all([
        loadMobileMoneyTotal(),
        loadOrderTotals(),
        loadRecentTransactions(),
        loadPendingWithdrawals(),
      ]);

      // Ensure notifications exist for pending withdrawals (for signers)
      if (walletForNotifications) {
        await ensurePendingWithdrawalNotifications(walletForNotifications);
      }
      // Load SOL balance from chain
      isLoadingSolBalance = true;
      try {
        const session = await verifyWeb3Session();
        let wallet =
          session?.success && session.user?.wallet_address
            ? session.user.wallet_address
            : null;
        if (!wallet) {
          wallet = getActiveWalletAddress();
        }
        if (wallet) {
          const bal = await getBalance(wallet);
          if (bal !== null && bal !== undefined) {
            solBalance = `${bal.toFixed(3)} SOL`;
          } else {
            solBalance = "-- SOL";
          }
        } else {
          solBalance = "-- SOL";
        }
      } catch (_) {
        solBalance = "-- SOL";
      } finally {
        isLoadingSolBalance = false;
      }
    })();

    // Cleanup on destroy
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  });
</script>

<div class="min-h-screen bg-gray-900 text-white px-4 py-6">
  <!-- Header -->
  <div
    class="mb-6 transition-all duration-1000 transform {isLoaded
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">My Wallet</h1>
    <p class="text-gray-400 text-sm md:text-base">
      Manage your cryptocurrency assets and transactions
    </p>
  </div>

  <!-- Main Content Grid -->
  <div
    class="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8 transition-all duration-1000 transform {showContent
      ? 'translate-y-0 opacity-100'
      : 'translate-y-8 opacity-0'}"
  >
    <!-- Left Column - Balance and Portfolio -->
    <div class="lg:col-span-2 space-y-6 lg:space-y-8">
      <!-- Current Balance (Web3) -->
      <WalletBalance
        balance={isLoadingTotal ? "--" : `NLe ${totalDisplay}`}
        isLoading={isLoadingTotal}
      />

      <!-- Mobile Money Total -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
        >
          <div class="text-sm text-gray-400 mb-1">Mobile Money Balance</div>
          {#if isLoadingMobileMoney}
            <div class="text-2xl font-bold text-white flex items-center gap-2">
              <svg
                class="animate-spin h-5 w-5 text-cyan-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading...</span>
            </div>
          {:else}
            <div class="text-2xl font-bold text-white">
              NLe {mobileMoneyTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          {/if}
          <div class="text-xs text-gray-500 mt-1">
            All completed mobile money orders
          </div>
          <div class="pt-1">
            <button
              on:click={openWithdrawalModal}
              disabled={mobileMoneyTotal <= 0 ||
                isLoadingMobileMoney ||
                isWithdrawing}
              class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                {mobileMoneyTotal > 0 && !isLoadingMobileMoney && !isWithdrawing
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}"
            >
              {isWithdrawing ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </div>

        <div
          class="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3"
        >
          <div class="text-sm text-gray-400 mb-1">Solana Revenue</div>
          {#if isLoadingSolana}
            <div class="text-2xl font-bold text-white flex items-center gap-2">
              <svg
                class="animate-spin h-5 w-5 text-cyan-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading...</span>
            </div>
          {:else}
            <div class="text-2xl font-bold text-white">
              {solanaOrdersTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          {/if}
          <div class="text-xs text-gray-500 mt-1">
            All completed Solana orders
          </div>
        </div>
      </div>

      <!-- Multi-Signature Settings -->
      {#if currentWalletAddress}
        <MultisigSettings walletAddress={currentWalletAddress} />
      {:else if !isLoadingTotal && !isLoadingMobileMoney}
        <!-- Wait for wallet to be detected -->
        <div class="bg-gray-800 rounded-lg p-6 text-center space-y-3">
          <p class="text-gray-400 text-sm">Detecting wallet...</p>
          <button
            on:click={async () => {
              currentWalletAddress = await getCurrentWallet();
              if (!currentWalletAddress) {
                showToast(
                  "error",
                  "Wallet Not Found",
                  "Please connect your wallet extension.",
                  5000
                );
              }
            }}
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
          >
            Retry Detection
          </button>
        </div>
      {/if}

      <!-- Pending Withdrawals -->
      {#if pendingWithdrawals.length > 0}
        <div class="space-y-4">
          <h2 class="text-lg sm:text-xl font-bold text-white">
            Pending Withdrawals
          </h2>
          <div class="space-y-3">
            {#each pendingWithdrawals as withdrawal (withdrawal.id)}
              <PendingWithdrawalCard {withdrawal} />
            {/each}
          </div>
        </div>
      {/if}

      <!-- Portfolio Overview -->
      <MaintenanceWrapper
        isUnderMaintenance={true}
        disableContent={true}
        message="Portfolio overview is currently under maintenance. We're working on improving this feature."
        variant="default"
        showIcon={true}
      >
        <PortfolioOverview />
      </MaintenanceWrapper>

      <!-- Recent Transactions -->
      <RecentTransactions
        transactions={recentTx}
        isLoading={isLoadingTransactions}
      />
    </div>

    <!-- Right Column - Network Status -->
    <div class="lg:col-span-1">
      <NetworkStatus />
    </div>
  </div>

  <!-- Withdrawal Modal -->
  {#if showWithdrawalModal}
    <!-- Modal Backdrop - click outside to close -->
    <button
      type="button"
      class="fixed inset-0 bg-black/70 z-50 p-2 sm:p-4 border-none cursor-default"
      on:click={closeWithdrawalModal}
      aria-label="Close modal"
    ></button>
    <!-- Modal Content -->
    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 pointer-events-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdrawal-modal-title"
    >
      <div
        class="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl pointer-events-auto my-auto max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
      >
        <div
          class="flex items-center justify-between mb-4 sticky top-0 bg-gray-800 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-0 pb-2 border-b border-gray-700"
        >
          <h3
            id="withdrawal-modal-title"
            class="text-lg sm:text-xl font-bold text-white"
          >
            Withdraw Mobile Money
          </h3>
          <button
            on:click={closeWithdrawalModal}
            class="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Amount Display -->
          <div class="bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div>
              <div class="text-sm text-gray-400 mb-1">Withdrawal Amount</div>
              <div class="text-2xl font-bold text-white">
                NLe {mobileMoneyTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div class="border-t border-gray-600 pt-2 space-y-2">
              <!-- Platform Fee (5%) -->
              {#if withdrawalPlatformFee > 0}
                <div
                  class="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>Platform Fee (5%):</span>
                  <span
                    >-NLe {withdrawalPlatformFee.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              {/if}

              <!-- Monime Processing Fee (1%) -->
              {#if estimatedMonimeFee > 0}
                <div
                  class="flex items-center justify-between text-xs text-gray-400"
                >
                  <span>Processing Fee (1%):</span>
                  <span
                    >-NLe {estimatedMonimeFee.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              {/if}

              <!-- Total Fees -->
              {#if withdrawalPlatformFee > 0 || estimatedMonimeFee > 0}
                <div
                  class="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-700"
                >
                  <span>Total Fees:</span>
                  <span
                    >-NLe {(
                      withdrawalPlatformFee + estimatedMonimeFee
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span
                  >
                </div>
              {/if}

              <!-- Net Amount -->
              <div
                class="flex items-center justify-between text-sm text-gray-300 pt-2 border-t border-gray-600"
              >
                <span class="font-medium">Amount You'll Receive:</span>
                <span class="font-bold text-cyan-400"
                  >NLe {withdrawalNetAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span
                >
              </div>
            </div>
          </div>

          <!-- Provider Selection -->
          <div>
            <div class="block text-sm font-medium text-gray-300 mb-2">
              Mobile Money Provider
            </div>
            <div
              class="grid grid-cols-2 gap-3"
              role="group"
              aria-label="Mobile Money Provider"
            >
              <button
                on:click={() => (withdrawalProvider = "orange_money")}
                class="px-4 py-3 rounded-lg border-2 transition-colors text-sm font-semibold
                  {withdrawalProvider === 'orange_money'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'}"
              >
                Orange Money
              </button>
              <button
                on:click={() => (withdrawalProvider = "afrimoney")}
                class="px-4 py-3 rounded-lg border-2 transition-colors text-sm font-semibold
                  {withdrawalProvider === 'afrimoney'
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                  : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'}"
              >
                Afrimoney
              </button>
            </div>
          </div>

          <!-- Phone Number Input -->
          <div>
            <label
              for="withdrawal-phone"
              class="block text-sm font-medium text-gray-300 mb-2"
            >
              Phone Number
            </label>
            <input
              id="withdrawal-phone"
              type="tel"
              bind:value={withdrawalPhoneNumber}
              placeholder="+23278000000"
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              disabled={isWithdrawing}
            />
            <p class="text-xs text-gray-400 mt-1">
              Include country code (e.g., +232 for Sierra Leone)
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 sm:gap-3 pt-2">
            <button
              on:click={closeWithdrawalModal}
              disabled={isWithdrawing}
              class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              on:click={handleWithdrawMobileMoney}
              disabled={isWithdrawing || !withdrawalPhoneNumber.trim()}
              class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg text-sm sm:text-base font-semibold hover:from-cyan-600 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isWithdrawing}
                <span class="flex items-center justify-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              {:else}
                Confirm Withdrawal
              {/if}
            </button>
          </div>
        </div>
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

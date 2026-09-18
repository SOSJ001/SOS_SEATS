import { json } from "@sveltejs/kit";
import {
  listWalletTransactions,
  insertWalletTransaction,
  updateWalletTransaction,
  getWalletTransactionById,
  listOrdersForWallet,
  getOrderById,
  listSignerPendingWithdrawals,
  listOrganizerOrders,
} from "$lib/server/wallet";
import { getUserPublicKey } from "$lib/server/walletDirectory";

async function resolveSessionWallet(locals) {
  const userId = locals.web3UserId ?? locals.userId;
  if (!userId) return null;
  if (locals.linkedWalletAddress) return locals.linkedWalletAddress;
  const { data } = await getUserPublicKey(userId);
  return data?.[0]?.wallet_address || data?.[0]?.publicKey || null;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
  const userId = locals.userId ?? locals.web3UserId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const action = url.searchParams.get("action") || "transactions";
  const wallet = url.searchParams.get("wallet") || (await resolveSessionWallet(locals));

  if (action === "transactions") {
    if (!wallet) return json({ success: true, data: [] });
    const result = await listWalletTransactions(wallet, {
      limit: Number(url.searchParams.get("limit") || 100),
      type: url.searchParams.get("type") || undefined,
      status: url.searchParams.get("status") || undefined,
    });
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "transaction") {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ success: false, error: "id required" }, { status: 400 });
    }
    // No wallet filter: multisig signers must read primary-wallet rows by id
    const result = await getWalletTransactionById(id);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "orders") {
    if (!wallet) return json({ success: true, data: [] });
    const result = await listOrdersForWallet(wallet);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "order") {
    const id = url.searchParams.get("id");
    if (!id) {
      return json({ success: false, error: "id required" }, { status: 400 });
    }
    const result = await getOrderById(id);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "organizer-orders") {
    const eventId = url.searchParams.get("event_id") || undefined;
    const paymentMethods = (url.searchParams.get("payment_methods") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const paymentStatuses = (url.searchParams.get("payment_statuses") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const limitParam = url.searchParams.get("limit");
    const result = await listOrganizerOrders(userId, {
      eventId,
      paymentMethods: paymentMethods.length ? paymentMethods : undefined,
      paymentStatuses: paymentStatuses.length ? paymentStatuses : ["paid", "completed"],
      limit: limitParam ? Number(limitParam) : undefined,
    });
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (action === "signer-pending") {
    const wallets = (url.searchParams.get("wallets") || "")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    const result = await listSignerPendingWithdrawals(wallets);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
  const userId = locals.userId ?? locals.web3UserId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const sessionWallet = await resolveSessionWallet(locals);

  if (body.action === "insert") {
    const row = body.row || {};
    if (sessionWallet && row.wallet_address && row.wallet_address !== sessionWallet) {
      return json({ success: false, error: "Wallet mismatch" }, { status: 403 });
    }
    if (sessionWallet && !row.wallet_address) {
      row.wallet_address = sessionWallet;
    }
    const result = await insertWalletTransaction(row);
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  if (body.action === "update") {
    const { id, updates } = body;
    if (!id || !updates) {
      return json({ success: false, error: "id and updates required" }, { status: 400 });
    }
    const result = await updateWalletTransaction(
      id,
      updates,
      sessionWallet || undefined
    );
    if (result.error) {
      return json({ success: false, error: result.error }, { status: 400 });
    }
    return json({ success: true, data: result.data });
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

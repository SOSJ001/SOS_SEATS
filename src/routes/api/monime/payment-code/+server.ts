import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  cancelMonimePaymentCode,
  createCheckoutHold,
  createPaymentCode,
  parsePrivateIssueQty,
  privateIssueChargeCents,
  privateIssueFeeTotal,
  PRIVATE_ISSUE_FEE_NLE,
  PRIVATE_ISSUE_MAX_QTY,
  recordPendingPrivateIssuePayment,
  updateHold,
  validateCheckoutQuote,
} from "$lib/server/payments";
import { assertPrivateEventOwnedByUser } from "$lib/server/events";
import { getLedgerKey } from "$lib/server/wallet";

interface PaymentCodeRequest {
  name: string;
  amount: { currency: string; value: number };
  mode?: "one_time" | "recurrent";
  duration?: string;
  authorizedProviders?: string[];
  metadata?: Record<string, unknown>;
  reference?: string;
}

function codeIdOf(data: unknown): string {
  const id = (data as { id?: unknown } | null)?.id;
  return typeof id === "string" ? id : "";
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.userId;
  if (!userId) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: PaymentCodeRequest = await request.json();
    const metadata: Record<string, unknown> = {
      ...(body.metadata || {}),
      buyer_id: userId,
    };
    const paymentMethod = String(body.metadata?.payment_method || "orange_money");
    const isPrivateIssue = body.metadata?.purpose === "private_issue";

    let holdId: string | null = null;
    let privateIssue: { eventId: string; qty: number } | null = null;

    if (isPrivateIssue) {
      const qty = parsePrivateIssueQty(body.metadata?.qty);
      if (qty === null) {
        return json(
          {
            success: false,
            error: `Quantity must be a whole number from 1 to ${PRIVATE_ISSUE_MAX_QTY}`,
          },
          { status: 400 }
        );
      }
      const eventId = String(body.metadata?.event_id || "").trim();
      if (!eventId) {
        return json(
          { success: false, error: "Event not found or unauthorized" },
          { status: 403 }
        );
      }
      const check = await assertPrivateEventOwnedByUser(eventId, userId);
      if (!check.ok) {
        return json({ success: false, error: check.error }, { status: check.status });
      }
      if (
        body.amount?.currency !== "SLE" ||
        Number(body.amount?.value) !== privateIssueChargeCents(qty)
      ) {
        return json(
          {
            success: false,
            error: "The amount does not match the private issue fee. Refresh the page and try again.",
            code: "price_changed",
          },
          { status: 409 }
        );
      }
      metadata.qty = String(qty);
      metadata.fee_each = String(PRIVATE_ISSUE_FEE_NLE);
      metadata.fee_total = String(privateIssueFeeTotal(qty));
      privateIssue = { eventId, qty };
    } else {
      const quote = await validateCheckoutQuote({
        metadata: body.metadata,
        amount: body.amount,
      });
      if (!quote.ok) {
        return json(
          { success: false, error: quote.message, code: quote.code },
          { status: 409 }
        );
      }

      const hold = await createCheckoutHold({
        eventId: quote.eventId,
        buyerId: userId,
        selectedTickets: quote.selected,
        amount: quote.chargeCents / 100,
        paymentMethod,
      });
      if (!hold.ok) {
        return json(
          { success: false, error: hold.message, code: hold.code },
          { status: 409 }
        );
      }
      holdId = hold.holdId;
      metadata.hold_id = hold.holdId;

      // The buyer's earlier code for this event would buy the same ticket twice.
      for (const oldCodeId of hold.replacedCodeIds) {
        const cancelled = await cancelMonimePaymentCode(oldCodeId).catch(() => null);
        if (!cancelled?.ok) {
          console.warn("[payment-code] could not cancel replaced code", oldCodeId);
        }
      }
    }

    const result = await createPaymentCode({ ...body, metadata });

    if (!result.ok) {
      if (holdId) {
        await updateHold(holdId, { status: "failed", error: result.error });
      }
      return json(
        {
          success: false,
          error: result.error,
          details: result.details,
          isInfrastructureError: result.isInfrastructureError,
        },
        { status: result.status }
      );
    }

    const codeId = codeIdOf(result.data);
    if (holdId && codeId) {
      await updateHold(holdId, { payment_code_id: codeId });
    }
    if (privateIssue && codeId) {
      const { error } = await recordPendingPrivateIssuePayment({
        paymentCodeId: codeId,
        eventId: privateIssue.eventId,
        userId,
        ledgerKey: getLedgerKey(locals) || `user:${userId}`,
        qty: privateIssue.qty,
        paymentMethod,
      });
      if (error) console.error("[payment-code] pending private issue row", error);
    }

    return json({ success: true, data: result.data });
  } catch (error) {
    return json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create payment code",
      },
      { status: 500 }
    );
  }
};

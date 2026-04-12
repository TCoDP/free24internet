import { NextResponse } from "next/server";
import { findUserById } from "@/lib/auth/users";
import { hasCompletedPurchaseByExternalId } from "@/lib/payments/transactions";
import { creditUserBalanceRubByTgId } from "@/lib/payments/credit-user-balance";
import { monetaPaymentNotificationSignature } from "@/lib/payments/moneta-assistant";
import {
  findMonetaCheckoutSession,
  markMonetaCheckoutCompletedForce,
} from "@/lib/payments/moneta-pending";
import { applyPlanPurchase } from "@/lib/subscription/purchase";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { isActivePlanMonths } from "@/lib/pricing/pricing-config";

export const runtime = "nodejs";

function textResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function paramsFromRequest(req: Request): Promise<Record<string, string>> {
  const method = req.method.toUpperCase();
  if (method === "GET") {
    const u = new URL(req.url);
    return Object.fromEntries(u.searchParams.entries());
  }
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const raw = await req.text();
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }
  const fd = await req.formData();
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    out[k] = typeof v === "string" ? v : "";
  });
  return out;
}

/**
 * Pay URL от Монета / PayAnyWay: подпись и поля как в документации и payanyway-python.
 * В личном кабинете укажите: https://&lt;ваш домен&gt;/api/webhooks/moneta
 */
export async function GET(req: Request) {
  return handleMoneta(req);
}

export async function POST(req: Request) {
  return handleMoneta(req);
}

async function handleMoneta(req: Request) {
  const monetaSecret = process.env.MONETA_SECRET?.trim();
  const expectedAccountId = process.env.MONETA_ACCOUNT_ID?.trim();
  if (!monetaSecret || !expectedAccountId) {
    console.error("[webhooks/moneta] MONETA_SECRET / MONETA_ACCOUNT_ID not set");
    return textResponse("FAIL", 503);
  }

  try {
    const p = await paramsFromRequest(req);
    const get = (k: string) => (p[k] != null ? String(p[k]) : "");

    const mntId = get("MNT_ID");
    const mntTransactionId = get("MNT_TRANSACTION_ID");
    const mntOperationId = get("MNT_OPERATION_ID");
    const mntAmount = get("MNT_AMOUNT");
    const mntCurrency = get("MNT_CURRENCY_CODE") || "RUB";
    const mntTestMode = get("MNT_TEST_MODE") || "0";
    const mntSignature = get("MNT_SIGNATURE").toLowerCase();

    if (!mntTransactionId || !mntAmount) {
      return textResponse("FAIL", 400);
    }

    if (mntId && mntId !== expectedAccountId) {
      console.warn("[webhooks/moneta] MNT_ID mismatch");
      return textResponse("FAIL", 403);
    }

    const expectedSig = monetaPaymentNotificationSignature({
      accountId: mntId || expectedAccountId,
      transactionId: mntTransactionId,
      operationId: mntOperationId,
      amountStr: mntAmount,
      currencyCode: mntCurrency,
      testModeStr: mntTestMode,
      secret: monetaSecret,
    }).toLowerCase();

    if (mntSignature !== expectedSig) {
      console.warn("[webhooks/moneta] invalid MNT_SIGNATURE");
      return textResponse("FAIL", 403);
    }

    const externalId = mntOperationId.trim() || mntTransactionId;
    if (await hasCompletedPurchaseByExternalId(externalId)) {
      await markMonetaCheckoutCompletedForce(mntTransactionId);
      return textResponse("SUCCESS", 200);
    }

    const pending = await findMonetaCheckoutSession(mntTransactionId);
    if (!pending) {
      console.warn("[webhooks/moneta] unknown MNT_TRANSACTION_ID", mntTransactionId);
      return textResponse("FAIL", 404);
    }

    if (pending.completed_at) {
      return textResponse("SUCCESS", 200);
    }

    const userId = Number(pending.user_id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return textResponse("FAIL", 400);
    }

    const pendingAmount = Number(pending.amount_rub);
    const paidAmount = Number(mntAmount);
    if (!Number.isFinite(paidAmount) || Math.abs(pendingAmount - paidAmount) > 0.02) {
      console.warn("[webhooks/moneta] amount mismatch", pendingAmount, paidAmount);
      return textResponse("FAIL", 400);
    }

    const purpose = String(pending.purpose ?? "plan").trim() || "plan";

    if (purpose === "balance") {
      const siteUser = await findUserById(userId);
      const tgRaw = siteUser?.tg_id;
      const tgId = tgRaw != null ? Number(tgRaw) : NaN;
      if (!Number.isFinite(tgId) || tgId <= 0) {
        console.warn("[webhooks/moneta] balance top-up: no tg_id for user", userId);
        return textResponse("FAIL", 400);
      }
      const credited = await creditUserBalanceRubByTgId(tgId, paidAmount);
      if (!credited.ok) {
        console.error("[webhooks/moneta] creditUserBalanceRubByTgId failed", { userId, tgId, paidAmount });
        return textResponse("FAIL", 500);
      }
      await markMonetaCheckoutCompletedForce(mntTransactionId);
      return textResponse("SUCCESS", 200);
    }

    const planMonths = Number(pending.plan_months);
    const pricing = await getPricingConfig();
    if (!Number.isFinite(planMonths) || !isActivePlanMonths(planMonths, pricing)) {
      return textResponse("FAIL", 400);
    }

    const referral = pending.referral_code?.trim() || undefined;
    const result = await applyPlanPurchase(userId, planMonths, referral, {
      paymentProvider: "moneta",
      externalPaymentId: externalId,
    });

    if (!result.ok) {
      console.error("[webhooks/moneta] applyPlanPurchase", result.error);
      return textResponse("FAIL", 500);
    }

    await markMonetaCheckoutCompletedForce(mntTransactionId);
    return textResponse("SUCCESS", 200);
  } catch (e) {
    console.error("[webhooks/moneta]", e);
    return textResponse("FAIL", 500);
  }
}

import { NextResponse } from "next/server";
import { findUserByTgId } from "@/lib/auth/users";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { isActivePlanMonths } from "@/lib/pricing/pricing-config";
import { applyPlanPurchase } from "@/lib/subscription/purchase";

export const runtime = "nodejs";

/**
 * Вызывать из Telegram-бота после успешной оплаты.
 * Заголовок: X-Subscription-Grant-Secret: SUBSCRIPTION_GRANT_SECRET
 */
export async function POST(req: Request) {
  const expected = process.env.SUBSCRIPTION_GRANT_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const got = req.headers.get("x-subscription-grant-secret");
  if (got !== expected) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      telegramUserId?: number;
      planMonths?: number;
      referralCode?: string | null;
    };

    const tgId = Number(body.telegramUserId);
    if (!Number.isFinite(tgId) || tgId <= 0) {
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }

    const planMonths = Number(body.planMonths);
    const pricing = await getPricingConfig();
    if (!isActivePlanMonths(planMonths, pricing)) {
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }

    const referralCode =
      typeof body.referralCode === "string" && body.referralCode.trim()
        ? body.referralCode
        : undefined;

    const user = await findUserByTgId(tgId);
    if (!user) {
      return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
    }

    const result = await applyPlanPurchase(user.id, planMonths, referralCode, {
      paymentProvider: "telegram_bot",
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      userId: user.id,
      subscriptionUntil: result.subscriptionUntil.toISOString(),
      referrerBonusDays: result.referrerBonusDays ?? null,
    });
  } catch (e) {
    console.error("[internal/subscription-grant]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

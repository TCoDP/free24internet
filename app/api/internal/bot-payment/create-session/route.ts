import { NextResponse } from "next/server";
import { findUserByTgId } from "@/lib/auth/users";
import { userIsSitePayEligible } from "@/lib/account/site-pay-eligible";
import { createExternalCheckoutSession } from "@/lib/payments/external-checkout";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { isActivePlanMonths } from "@/lib/pricing/pricing-config";
import type { Locale } from "@/lib/locale";
import { pathPrefix } from "@/lib/locale";

export const runtime = "nodejs";

/**
 * Создание ссылки MONETA.Assistant для оплаты из Telegram-бота (тот же поток, что «Перейти к оплате» на сайте).
 * Заголовок: X-Bot-Payment-Secret: BOT_PAYMENT_SESSION_SECRET
 */
export async function POST(req: Request) {
  const expected = process.env.BOT_PAYMENT_SESSION_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  if (req.headers.get("x-bot-payment-secret") !== expected) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      telegramUserId?: number;
      planMonths?: number;
      referralCode?: string | null;
      locale?: string;
    };

    const tgId = Number(body.telegramUserId);
    if (!Number.isFinite(tgId) || tgId <= 0) {
      return NextResponse.json({ ok: false, reason: "validation" }, { status: 400 });
    }

    const planMonths = Number(body.planMonths);
    const pricing = await getPricingConfig();
    if (!isActivePlanMonths(planMonths, pricing)) {
      return NextResponse.json({ ok: false, reason: "validation" }, { status: 400 });
    }

    const user = await findUserByTgId(tgId);
    if (!user) {
      return NextResponse.json({ ok: false, reason: "no_site_user" }, { status: 404 });
    }

    if (!userIsSitePayEligible(user)) {
      return NextResponse.json({ ok: false, reason: "not_eligible" }, { status: 403 });
    }

    const base = process.env.AUTH_URL?.trim().replace(/\/$/, "");
    if (!base) {
      return NextResponse.json({ ok: false, reason: "no_auth_url" }, { status: 503 });
    }

    const locale: Locale = body.locale === "en" ? "en" : "ru";
    const returnUrl = `${base}${pathPrefix(locale)}/account/plans?payment=return&from=telegram`;

    const referralCode =
      typeof body.referralCode === "string" && body.referralCode.trim()
        ? body.referralCode
        : undefined;

    const created = await createExternalCheckoutSession(
      user.id,
      planMonths,
      referralCode,
      returnUrl,
      locale,
    );

    if (!created.ok) {
      return NextResponse.json({ ok: false, reason: created.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true, redirectUrl: created.redirectUrl });
  } catch (e) {
    console.error("[internal/bot-payment/create-session]", e);
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}

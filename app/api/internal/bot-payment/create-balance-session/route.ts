import { NextResponse } from "next/server";
import { findUserByTgId } from "@/lib/auth/users";
import { userIsSitePayEligible } from "@/lib/account/site-pay-eligible";
import { createBalanceTopupCheckoutSession } from "@/lib/payments/external-checkout";
import type { Locale } from "@/lib/locale";
import { pathPrefix } from "@/lib/locale";

export const runtime = "nodejs";

/**
 * Moneta: пополнение баланса в боте. Тот же секрет, что create-session.
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
      amountRub?: number;
      locale?: string;
    };

    const tgId = Number(body.telegramUserId);
    if (!Number.isFinite(tgId) || tgId <= 0) {
      return NextResponse.json({ ok: false, reason: "validation" }, { status: 400 });
    }

    const amountRub = Number(body.amountRub);
    if (!Number.isFinite(amountRub) || amountRub <= 0) {
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
    const returnUrl = `${base}${pathPrefix(locale)}/account/profile?payment=return&from=telegram&topup=1`;

    const created = await createBalanceTopupCheckoutSession(user.id, amountRub, returnUrl, locale);

    if (!created.ok) {
      const status =
        created.reason === "not_eligible" || created.reason === "no_telegram"
          ? 403
          : created.reason === "not_configured"
            ? 503
            : 400;
      return NextResponse.json({ ok: false, reason: created.reason }, { status: status });
    }

    return NextResponse.json({ ok: true, redirectUrl: created.redirectUrl });
  } catch (e) {
    console.error("[internal/bot-payment/create-balance-session]", e);
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}

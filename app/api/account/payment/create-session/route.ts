import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pathPrefix } from "@/lib/locale";
import type { Locale } from "@/lib/messages/types";
import { createExternalCheckoutSession } from "@/lib/payments/external-checkout";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { isActivePlanMonths } from "@/lib/pricing/pricing-config";

export const runtime = "nodejs";

/**
 * Старт оплаты через внешний сервис. Пока `createExternalCheckoutSession` возвращает null — ответ { ok: false, reason: "not_configured" }.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      planMonths?: number;
      referralCode?: string | null;
      locale?: string;
    };

    const planMonths = Number(body.planMonths);
    const pricing = await getPricingConfig();
    if (!isActivePlanMonths(planMonths, pricing)) {
      return NextResponse.json({ ok: false, reason: "validation" }, { status: 400 });
    }

    const referralCode =
      typeof body.referralCode === "string" && body.referralCode.trim()
        ? body.referralCode
        : undefined;

    const locale: Locale = body.locale === "en" ? "en" : "ru";
    const base = process.env.AUTH_URL?.trim().replace(/\/$/, "");
    if (!base) {
      return NextResponse.json({ ok: false, reason: "no_auth_url" }, { status: 503 });
    }

    const returnUrl = `${base}${pathPrefix(locale)}/account/plans?payment=return`;

    const created = await createExternalCheckoutSession(
      userId,
      planMonths,
      referralCode,
      returnUrl,
      locale,
    );
    if (!created.ok) {
      return NextResponse.json({ ok: false, reason: created.reason });
    }

    return NextResponse.json({ ok: true, redirectUrl: created.redirectUrl });
  } catch (e) {
    console.error("[account/payment/create-session]", e);
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}

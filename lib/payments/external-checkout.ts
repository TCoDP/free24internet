import { findUserById } from "@/lib/auth/users";
import { userIsSitePayEligible } from "@/lib/account/site-pay-eligible";
import { SITE_ORIGIN } from "@/lib/constants";
import { buildMonetaAssistantPaymentUrl } from "@/lib/payments/moneta-assistant";
import { insertMonetaCheckoutSession } from "@/lib/payments/moneta-pending";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { planPayRubFromConfig } from "@/lib/pricing/pricing-config";
import { randomBytes } from "crypto";

/** Имя магазина в MNT_DESCRIPTION (в кабинете / СБП часто показывают это поле). */
function monetaStoreDisplayName(): string {
  const explicit = process.env.MONETA_STORE_NAME?.trim();
  if (explicit) return explicit;
  const auth = process.env.AUTH_URL?.trim();
  if (auth) {
    try {
      const h = new URL(auth).hostname.replace(/^www\./i, "");
      if (h) return h;
    } catch {
      /* ignore */
    }
  }
  try {
    const h = new URL(SITE_ORIGIN).hostname.replace(/^www\./i, "");
    if (h) return h;
  } catch {
    /* ignore */
  }
  return "free24internet.vip";
}

export type ExternalCheckoutResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; reason: "not_configured" | "not_eligible" };

function monetaEnv(): {
  accountId: string;
  secret: string;
  testMode: boolean;
  demoHost: boolean;
} | null {
  const accountId = process.env.MONETA_ACCOUNT_ID?.trim();
  const secret = process.env.MONETA_SECRET?.trim();
  if (!accountId || !secret) return null;
  const demo =
    process.env.MONETA_DEMO?.trim() === "1" ||
    process.env.MONETA_DEMO?.trim()?.toLowerCase() === "true";
  return {
    accountId,
    secret,
    testMode: demo,
    demoHost: demo,
  };
}

/**
 * Moneta / PayAnyWay MONETA.Assistant — только для пользователей с users.is_their = 1.
 * См. https://git.pub.moneta.ru/Moneta-Labs/moneta-sdk-php и документацию PayAnyWay.
 */
export async function createExternalCheckoutSession(
  userId: number,
  planMonths: number,
  referralCode: string | undefined,
  returnUrl: string,
  locale: "ru" | "en",
): Promise<ExternalCheckoutResult> {
  const user = await findUserById(userId);
  if (!user || !userIsSitePayEligible(user)) {
    return { ok: false, reason: "not_eligible" };
  }

  const moneta = monetaEnv();
  if (!moneta) {
    return { ok: false, reason: "not_configured" };
  }

  const cfg = await getPricingConfig();
  const amountRub = planPayRubFromConfig(planMonths, cfg);
  if (amountRub == null) {
    return { ok: false, reason: "not_eligible" };
  }
  const suffix = randomBytes(6).toString("hex");
  const mntTransactionId = `f24_${userId}_${planMonths}_${Date.now()}_${suffix}`.slice(0, 255);

  await insertMonetaCheckoutSession({
    mntTransactionId,
    userId,
    planMonths,
    referralCode: referralCode?.trim() || null,
    amountRub,
  });

  const store = monetaStoreDisplayName();
  const description =
    locale === "en"
      ? `${store} — subscription ${planMonths} mo.`
      : `${store} — подписка ${planMonths} мес.`;

  const redirectUrl = buildMonetaAssistantPaymentUrl({
    accountId: moneta.accountId,
    transactionId: mntTransactionId,
    amountRub,
    currencyCode: "RUB",
    testMode: moneta.testMode,
    useDemoHost: moneta.demoHost,
    secret: moneta.secret,
    successUrl: returnUrl,
    description,
    locale,
    custom1: String(userId),
  });

  return { ok: true, redirectUrl };
}

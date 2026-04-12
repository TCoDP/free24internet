import type { Locale } from "@/lib/messages/types";
import type { PricingCard, SiteMessages } from "@/lib/messages/types";
import {
  activePlanMonthValues,
  discountRateForPlan,
  formatRub,
  planPayRubFromConfig,
  planSavingsRubFromConfig,
  type PricingConfig,
} from "@/lib/pricing/pricing-config";
import { sortPricingCardsForDisplay } from "@/lib/pricing/sort-pricing-cards";

function buildSubtitle(cfg: PricingConfig, locale: Locale): string {
  const b = cfg.baseMonthlyRub;
  const t = cfg.trialDays;
  if (locale === "en") {
    return `Base price ${b}₽ per month. ${t}-day free trial. Longer prepaid periods mean a lower effective monthly cost.`;
  }
  return `Базовая цена ${b}₽ за месяц. Пробный период ${t} дней. Чем дольше срок оплаты, тем ниже цена за месяц.`;
}

function enrichCard(card: PricingCard, cfg: PricingConfig, locale: Locale): PricingCard | null {
  if (card.planMonths == null) {
    const period =
      locale === "en" ? ` / ${cfg.trialDays} days` : ` / ${cfg.trialDays} дней`;
    return { ...card, period };
  }
  const m = card.planMonths;
  const pay = planPayRubFromConfig(m, cfg);
  if (pay == null) return null;
  const savings = planSavingsRubFromConfig(m, cfg);
  const pct = Math.round(discountRateForPlan(m, cfg) * 100);
  const blurb =
    m === 1
      ? locale === "en"
        ? "No bundle discount."
        : "Без скидки за объём."
      : locale === "en"
        ? `${pct}% off vs ${m}× monthly.`
        : `Скидка ${pct}% от суммы ${m} мес. по базовой цене.`;

  const features = card.features.map((f, i) => {
    if (i !== 0 || savings <= 0) return f;
    if (f.includes("Экономия") || f.includes("Save")) {
      return locale === "en" ? `Save ${formatRub(savings)}` : `Экономия ${formatRub(savings)}`;
    }
    return f;
  });

  return {
    ...card,
    price: formatRub(pay),
    blurb,
    features,
  };
}

/** Подставляет цены и срок пробного периода из БД; убирает карточки отключённых тарифов. */
export function applyPricingToSiteMessages(
  messages: SiteMessages,
  cfg: PricingConfig,
): SiteMessages {
  const locale = messages.locale;
  const cardsRaw = messages.pricingSection.cards
    .map((c) => enrichCard(c, cfg, locale))
    .filter((c): c is PricingCard => c != null);
  const cards = sortPricingCardsForDisplay(cardsRaw, cfg);
  return {
    ...messages,
    pricingSection: {
      ...messages.pricingSection,
      subtitle: buildSubtitle(cfg, locale),
      cards,
    },
  };
}

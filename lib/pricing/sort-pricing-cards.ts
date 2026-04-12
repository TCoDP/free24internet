import type { PricingCard } from "@/lib/messages/types";
import { planPayRubFromConfig, type PricingConfig } from "@/lib/pricing/pricing-config";

/** Сначала тарифы без planMonths (пробный), затем платные по убыванию итоговой цены. */
export function sortPricingCardsForDisplay(
  cards: readonly PricingCard[],
  cfg: PricingConfig,
): PricingCard[] {
  const trial = cards.filter((c) => c.planMonths == null);
  const paid = cards.filter((c) => c.planMonths != null);
  paid.sort((a, b) => {
    const pa = planPayRubFromConfig(a.planMonths!, cfg) ?? 0;
    const pb = planPayRubFromConfig(b.planMonths!, cfg) ?? 0;
    return pb - pa;
  });
  return [...trial, ...paid];
}

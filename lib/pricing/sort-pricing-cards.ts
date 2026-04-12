import type { PricingCard } from "@/lib/messages/types";

/**
 * Сначала пробный период, затем платные: 12 → 6 → 3 → 1 мес. (как на лендинге:
 * «12 месяцев / Максимальная выгода», затем остальные сроки).
 */
export function sortPricingCardsForDisplay(cards: readonly PricingCard[]): PricingCard[] {
  const trial = cards.filter((c) => c.planMonths == null);
  const paid = cards.filter((c) => c.planMonths != null);
  paid.sort((a, b) => b.planMonths! - a.planMonths!);
  return [...trial, ...paid];
}

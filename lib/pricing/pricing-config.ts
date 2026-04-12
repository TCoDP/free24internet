export type PricingPlanTerm = {
  id?: number;
  months: number;
  discountRate: number;
  referrerBonusDays: number;
  sortOrder: number;
  isActive: boolean;
};

export type PricingConfig = {
  baseMonthlyRub: number;
  trialDays: number;
  terms: PricingPlanTerm[];
};

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseMonthlyRub: 60,
  trialDays: 7,
  terms: [
    { months: 12, discountRate: 0.15, referrerBonusDays: 30, sortOrder: 10, isActive: true },
    { months: 6, discountRate: 0.1, referrerBonusDays: 18, sortOrder: 20, isActive: true },
    { months: 3, discountRate: 0.05, referrerBonusDays: 12, sortOrder: 30, isActive: true },
    { months: 1, discountRate: 0, referrerBonusDays: 7, sortOrder: 40, isActive: true },
  ],
};

export function getActiveTerms(cfg: PricingConfig): PricingPlanTerm[] {
  return [...cfg.terms].filter((t) => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.months - b.months);
}

export function planPayRubFromConfig(months: number, cfg: PricingConfig): number | null {
  const t = getActiveTerms(cfg).find((x) => x.months === months);
  if (!t) return null;
  const raw = cfg.baseMonthlyRub * months * (1 - t.discountRate);
  return Math.round(raw);
}

export function planListPriceRubFromConfig(months: number, cfg: PricingConfig): number {
  return cfg.baseMonthlyRub * months;
}

export function planSavingsRubFromConfig(months: number, cfg: PricingConfig): number {
  const pay = planPayRubFromConfig(months, cfg);
  if (pay == null) return 0;
  return planListPriceRubFromConfig(months, cfg) - pay;
}

export function discountRateForPlan(months: number, cfg: PricingConfig): number {
  const t = getActiveTerms(cfg).find((x) => x.months === months);
  return t?.discountRate ?? 0;
}

export function referrerBonusDaysFromConfig(months: number, cfg: PricingConfig): number {
  const t = getActiveTerms(cfg).find((x) => x.months === months);
  return t?.referrerBonusDays ?? 0;
}

export function isActivePlanMonths(months: number, cfg: PricingConfig): boolean {
  return planPayRubFromConfig(months, cfg) != null;
}

export function activePlanMonthValues(cfg: PricingConfig): number[] {
  return getActiveTerms(cfg).map((t) => t.months);
}

export function formatRub(n: number): string {
  return `${n}₽`;
}

/** Совместимость: раньше был union 1|3|6|12 */
export type PlanMonths = number;

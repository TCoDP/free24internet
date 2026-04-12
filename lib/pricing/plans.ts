/** Публичный вход для цен: расчёт из БД через getPricingConfig, типы и formatRub. */
export {
  activePlanMonthValues,
  DEFAULT_PRICING_CONFIG,
  discountRateForPlan,
  formatRub,
  isActivePlanMonths,
  planListPriceRubFromConfig,
  planPayRubFromConfig,
  planSavingsRubFromConfig,
  referrerBonusDaysFromConfig,
  type PlanMonths,
  type PricingConfig,
  type PricingPlanTerm,
} from "@/lib/pricing/pricing-config";

export { getPricingConfig } from "@/lib/pricing/load-pricing";

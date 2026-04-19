export const DEFAULT_PRICING_CONFIG = {
  baseMonthlyRub: 60,
  trialDays: 7,
  terms: [
    { months: 12, discountRate: 0.15, referrerBonusDays: 30, sortOrder: 10, isActive: true },
    { months: 6, discountRate: 0.1, referrerBonusDays: 18, sortOrder: 20, isActive: true },
    { months: 3, discountRate: 0.05, referrerBonusDays: 12, sortOrder: 30, isActive: true },
    { months: 1, discountRate: 0, referrerBonusDays: 7, sortOrder: 40, isActive: true },
  ],
};

export function getActiveTerms(cfg) {
  // Пустой [] с сервера — truthy в JS, иначе getActiveTerms давал [] и в модалке только «1 мес.»
  const raw = Array.isArray(cfg?.terms) ? cfg.terms : [];
  if (raw.length === 0) {
    return [...DEFAULT_PRICING_CONFIG.terms].sort((a, b) => {
      const soA = a.sort_order ?? a.sortOrder ?? 0;
      const soB = b.sort_order ?? b.sortOrder ?? 0;
      return soA - soB || a.months - b.months;
    });
  }
  const filtered = raw.filter((t) => {
    const on = t.is_active ?? t.isActive;
    return on !== false && on !== 0 && on !== '0';
  });
  const list = filtered.length > 0 ? filtered : DEFAULT_PRICING_CONFIG.terms;
  return [...list].sort((a, b) => {
    const soA = a.sort_order ?? a.sortOrder ?? 0;
    const soB = b.sort_order ?? b.sortOrder ?? 0;
    return soA - soB || a.months - b.months;
  });
}

export function planPayRubFromConfig(months, cfg) {
  const t = getActiveTerms(cfg).find((x) => x.months === months);
  if (!t) return null;
  const discountRate = parseFloat(t.discount_rate ?? t.discountRate ?? 0);
  const baseMonthlyRub = cfg.base_monthly_rub ?? cfg.baseMonthlyRub ?? 60;
  const raw = baseMonthlyRub * months * (1 - discountRate);
  return Math.round(raw);
}

export function planListPriceRubFromConfig(months, cfg) {
  const baseMonthlyRub = cfg.base_monthly_rub ?? cfg.baseMonthlyRub ?? 60;
  return baseMonthlyRub * months;
}

export function planSavingsRubFromConfig(months, cfg) {
  const pay = planPayRubFromConfig(months, cfg);
  if (pay == null) return 0;
  return planListPriceRubFromConfig(months, cfg) - pay;
}

export function discountRateForPlan(months, cfg) {
  const t = getActiveTerms(cfg).find((x) => x.months === months);
  return parseFloat(t?.discount_rate ?? t?.discountRate ?? 0);
}

export function referrerBonusDaysFromConfig(months, cfg) {
  const t = getActiveTerms(cfg).find((x) => x.months === months);
  return t?.referrer_bonus_days ?? t?.referrerBonusDays ?? 0;
}

export function isActivePlanMonths(months, cfg) {
  return planPayRubFromConfig(months, cfg) != null;
}

export function activePlanMonthValues(cfg) {
  return getActiveTerms(cfg).map((t) => t.months);
}

export function formatRub(n) {
  return `${n}₽`;
}

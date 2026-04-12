import { cache } from "react";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
  type PricingPlanTerm,
} from "@/lib/pricing/pricing-config";

type GlobalRow = RowDataPacket & { base_monthly_rub: number; trial_days: number };
type TermRow = RowDataPacket & {
  id: number;
  months: number;
  discount_rate: string | number;
  referrer_bonus_days: number;
  sort_order: number;
  is_active: number;
};

async function loadPricingConfigFromDb(): Promise<PricingConfig> {
  const pool = getPool();
  const [globalRows] = await pool.execute<GlobalRow[]>(
    "SELECT base_monthly_rub, trial_days FROM pricing_global WHERE id = 1 LIMIT 1",
  );
  const g = globalRows[0];
  if (!g) return DEFAULT_PRICING_CONFIG;

  const [termRows] = await pool.execute<TermRow[]>(
    "SELECT id, months, discount_rate, referrer_bonus_days, sort_order, is_active FROM pricing_plan_terms ORDER BY sort_order ASC, months ASC",
  );
  const terms: PricingPlanTerm[] = termRows.map((r) => ({
    id: r.id,
    months: r.months,
    discountRate: Number(r.discount_rate),
    referrerBonusDays: r.referrer_bonus_days,
    sortOrder: r.sort_order,
    isActive: Boolean(r.is_active),
  }));

  if (terms.length === 0) {
    return {
      baseMonthlyRub: g.base_monthly_rub,
      trialDays: g.trial_days,
      terms: DEFAULT_PRICING_CONFIG.terms,
    };
  }

  return {
    baseMonthlyRub: g.base_monthly_rub,
    trialDays: g.trial_days,
    terms,
  };
}

/**
 * Конфигурация цен для запроса (кэш React — одно чтение БД на рендер).
 * При отсутствии таблиц/ошибке — значения по умолчанию из кода.
 */
export const getPricingConfig = cache(async (): Promise<PricingConfig> => {
  try {
    return await loadPricingConfigFromDb();
  } catch (e) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
    if (code !== "ER_NO_SUCH_TABLE") {
      console.warn("[getPricingConfig] DB unavailable, using defaults", e);
    }
    return DEFAULT_PRICING_CONFIG;
  }
});

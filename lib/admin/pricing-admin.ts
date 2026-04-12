import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";

export type PricingGlobalRow = {
  base_monthly_rub: number;
  trial_days: number;
};

export type PricingTermAdminRow = {
  id: number;
  months: number;
  discount_rate: number;
  referrer_bonus_days: number;
  sort_order: number;
  is_active: number;
};

type GlobalPacket = PricingGlobalRow & RowDataPacket;
type TermPacket = RowDataPacket & {
  id: number;
  months: number;
  discount_rate: string | number;
  referrer_bonus_days: number;
  sort_order: number;
  is_active: number;
};

export async function adminGetPricingGlobalRow(): Promise<PricingGlobalRow> {
  const pool = getPool();
  const [rows] = await pool.execute<GlobalPacket[]>(
    "SELECT base_monthly_rub, trial_days FROM pricing_global WHERE id = 1 LIMIT 1",
  );
  return rows[0] ?? { base_monthly_rub: 60, trial_days: 7 };
}

export async function adminListPricingTerms(): Promise<PricingTermAdminRow[]> {
  const pool = getPool();
  const [rows] = await pool.execute<TermPacket[]>(
    `SELECT id, months, discount_rate, referrer_bonus_days, sort_order, is_active
     FROM pricing_plan_terms ORDER BY sort_order ASC, months ASC`,
  );
  return rows.map((r) => ({
    id: r.id,
    months: r.months,
    discount_rate: Number(r.discount_rate),
    referrer_bonus_days: r.referrer_bonus_days,
    sort_order: r.sort_order,
    is_active: r.is_active,
  }));
}

export async function adminUpdatePricingGlobal(input: {
  baseMonthlyRub: number;
  trialDays: number;
}): Promise<void> {
  const pool = getPool();
  const base = Math.max(1, Math.min(1_000_000, Math.floor(input.baseMonthlyRub)));
  const trial = Math.max(0, Math.min(365, Math.floor(input.trialDays)));
  await pool.execute(
    "UPDATE pricing_global SET base_monthly_rub = ?, trial_days = ? WHERE id = 1",
    [base, trial],
  );
}

export async function adminUpsertPricingTerm(input: {
  id?: number;
  months: number;
  discountRate: number;
  referrerBonusDays: number;
  sortOrder: number;
  isActive: boolean;
}): Promise<"ok" | "months_taken"> {
  const pool = getPool();
  const months = Math.max(1, Math.min(120, Math.floor(input.months)));
  const discount = Math.max(0, Math.min(0.99999, input.discountRate));
  const refDays = Math.max(0, Math.min(365, Math.floor(input.referrerBonusDays)));
  const sortOrder = Math.floor(input.sortOrder);
  const active = input.isActive ? 1 : 0;

  if (input.id != null && input.id > 0) {
    const [dup] = await pool.execute<({ id: number } & RowDataPacket)[]>(
      "SELECT id FROM pricing_plan_terms WHERE months = ? AND id <> ? LIMIT 1",
      [months, input.id],
    );
    if (dup[0]) return "months_taken";
    await pool.execute(
      `UPDATE pricing_plan_terms SET months = ?, discount_rate = ?, referrer_bonus_days = ?,
       sort_order = ?, is_active = ? WHERE id = ?`,
      [months, discount, refDays, sortOrder, active, input.id],
    );
    return "ok";
  }

  const [dup] = await pool.execute<({ id: number } & RowDataPacket)[]>(
    "SELECT id FROM pricing_plan_terms WHERE months = ? LIMIT 1",
    [months],
  );
  if (dup[0]) return "months_taken";

  await pool.execute<ResultSetHeader>(
    `INSERT INTO pricing_plan_terms (months, discount_rate, referrer_bonus_days, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [months, discount, refDays, sortOrder, active],
  );
  return "ok";
}

export async function adminDeletePricingTerm(id: number): Promise<boolean> {
  const pool = getPool();
  const [res] = await pool.execute<ResultSetHeader>("DELETE FROM pricing_plan_terms WHERE id = ?", [id]);
  return res.affectedRows > 0;
}

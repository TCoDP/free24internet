import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import { insertCompletedPurchaseTransaction } from "@/lib/payments/transactions";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import {
  isActivePlanMonths,
  planPayRubFromConfig,
  referrerBonusDaysFromConfig,
} from "@/lib/pricing/pricing-config";
import { findUserIdByReferralCode, normalizeReferralCode } from "@/lib/auth/users";

type UserSubRow = {
  id: number;
  referred_by_user_id: number | null;
  subscription_until: Date | null;
  trial_ends_at: Date | null;
} & RowDataPacket;

export type ApplyPurchaseResult =
  | {
      ok: true;
      subscriptionUntil: Date;
      referrerBonusDays?: number;
    }
  | { ok: false; error: "invalid_plan" | "invalid_referral" | "self_referral" | "referral_mismatch" };

export type ApplyPurchaseOptions = {
  /** Не дублировать запись (например, повтор вебхука провайдера) */
  skipTransaction?: boolean;
  /** Источник оплаты: telegram_bot, moneta и т.п. (в старых записях может быть test_redeem) */
  paymentProvider?: string;
  externalPaymentId?: string | null;
};

/**
 * Начисляет оплаченный период покупателю и бонус пригласившему (если есть валидный реферал).
 * Вызывать из бота (internal API) или вебхука платёжного сервиса.
 */
export async function applyPlanPurchase(
  userId: number,
  planMonths: number,
  referralCodeFromCheckout: string | null | undefined,
  options?: ApplyPurchaseOptions,
): Promise<ApplyPurchaseResult> {
  const cfg = await getPricingConfig();
  if (!isActivePlanMonths(planMonths, cfg)) {
    return { ok: false, error: "invalid_plan" };
  }

  const pool = getPool();
  const [rows] = await pool.execute<UserSubRow[]>(
    `SELECT id, referred_by_user_id, subscription_until, trial_ends_at
     FROM users WHERE id = ? LIMIT 1`,
    [userId],
  );
  const user = rows[0];
  if (!user) return { ok: false, error: "invalid_plan" };

  const codeNorm = referralCodeFromCheckout ? normalizeReferralCode(referralCodeFromCheckout) : "";
  let referrerId: number | null = user.referred_by_user_id;

  if (codeNorm) {
    const fromCode = await findUserIdByReferralCode(codeNorm);
    if (!fromCode) return { ok: false, error: "invalid_referral" };
    if (fromCode === userId) return { ok: false, error: "self_referral" };
    if (referrerId != null && referrerId !== fromCode) {
      return { ok: false, error: "referral_mismatch" };
    }
    referrerId = fromCode;
    if (user.referred_by_user_id == null) {
      await pool.execute("UPDATE users SET referred_by_user_id = ? WHERE id = ?", [referrerId, userId]);
    }
  }

  const now = new Date();
  const subEnd = user.subscription_until ? new Date(user.subscription_until) : null;
  const trialEnd = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  let base = now;
  if (subEnd && subEnd > base) base = subEnd;
  if (trialEnd && trialEnd > base) base = trialEnd;

  const newSubEnd = new Date(base);
  newSubEnd.setMonth(newSubEnd.getMonth() + planMonths);

  await pool.execute("UPDATE users SET subscription_until = ? WHERE id = ?", [newSubEnd, userId]);

  let bonus: number | undefined;
  if (referrerId != null && referrerId !== userId) {
    bonus = referrerBonusDaysFromConfig(planMonths, cfg);
    const [refRows] = await pool.execute<UserSubRow[]>(
      `SELECT id, subscription_until, trial_ends_at FROM users WHERE id = ? LIMIT 1`,
      [referrerId],
    );
    const refUser = refRows[0];
    if (refUser) {
      const rNow = new Date();
      let rBase = rNow;
      const rSub = refUser.subscription_until ? new Date(refUser.subscription_until) : null;
      const rTrial = refUser.trial_ends_at ? new Date(refUser.trial_ends_at) : null;
      if (rSub && rSub > rBase) rBase = rSub;
      if (rTrial && rTrial > rBase) rBase = rTrial;
      const refNewEnd = new Date(rBase);
      refNewEnd.setDate(refNewEnd.getDate() + bonus);
      await pool.execute("UPDATE users SET subscription_until = ? WHERE id = ?", [refNewEnd, referrerId]);
    }

    await pool.execute<ResultSetHeader>(
      `INSERT INTO referral_rewards (referrer_user_id, referee_user_id, plan_months, bonus_days)
       VALUES (?, ?, ?, ?)`,
      [referrerId, userId, planMonths, bonus],
    );
  }

  if (!options?.skipTransaction) {
    try {
      const amountRub = planPayRubFromConfig(planMonths, cfg);
      await insertCompletedPurchaseTransaction({
        userId,
        planMonths,
        amountRub: amountRub ?? 0,
        provider: options?.paymentProvider ?? "unknown",
        externalPaymentId: options?.externalPaymentId ?? null,
      });
    } catch (e) {
      console.error("[applyPlanPurchase] user_transactions insert failed", e);
    }
  }

  return { ok: true, subscriptionUntil: newSubEnd, referrerBonusDays: bonus };
}

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";

export type MonetaPendingRow = {
  mnt_transaction_id: string;
  user_id: number;
  /** plan — подписка на сайте; balance — пополнение баланса в боте */
  purpose: string;
  plan_months: number;
  referral_code: string | null;
  amount_rub: string;
  completed_at: Date | null;
};

type Packet = MonetaPendingRow & RowDataPacket;

export async function insertMonetaCheckoutSession(params: {
  mntTransactionId: string;
  userId: number;
  purpose?: "plan" | "balance";
  planMonths: number;
  referralCode: string | null;
  amountRub: number;
}): Promise<void> {
  const pool = getPool();
  const purpose = params.purpose ?? "plan";
  await pool.execute(
    `INSERT INTO moneta_checkout_sessions
      (mnt_transaction_id, user_id, purpose, plan_months, referral_code, amount_rub)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      params.mntTransactionId,
      params.userId,
      purpose,
      params.planMonths,
      params.referralCode,
      Number(params.amountRub.toFixed(2)),
    ],
  );
}

export async function findMonetaCheckoutSession(
  mntTransactionId: string,
): Promise<MonetaPendingRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<Packet[]>(
    `SELECT mnt_transaction_id, user_id,
            COALESCE(purpose, 'plan') AS purpose,
            plan_months, referral_code, amount_rub, completed_at
     FROM moneta_checkout_sessions WHERE mnt_transaction_id = ? LIMIT 1`,
    [mntTransactionId],
  );
  return rows[0] ?? null;
}

export async function markMonetaCheckoutCompleted(mntTransactionId: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE moneta_checkout_sessions SET completed_at = CURRENT_TIMESTAMP
     WHERE mnt_transaction_id = ? AND completed_at IS NULL`,
    [mntTransactionId],
  );
}

/** Помечаем завершённой даже если уже была (идемпотентность вебхука). */
export async function markMonetaCheckoutCompletedForce(mntTransactionId: string): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `UPDATE moneta_checkout_sessions SET completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
     WHERE mnt_transaction_id = ?`,
    [mntTransactionId],
  );
}

export async function deleteStaleMonetaCheckouts(olderThanHours: number): Promise<number> {
  const pool = getPool();
  const [res] = await pool.execute<ResultSetHeader>(
    `DELETE FROM moneta_checkout_sessions
     WHERE completed_at IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [olderThanHours],
  );
  return res.affectedRows;
}

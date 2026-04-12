import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";

export type UserTransactionRow = {
  id: number;
  user_id: number;
  amount_rub: string;
  plan_months: number;
  status: string;
  provider: string;
  external_payment_id: string | null;
  created_at: Date;
  completed_at: Date | null;
};

/** Для клиентских компонентов после сериализации из RSC (`Date` → ISO-строка). */
export type UserTransactionRowInput = Omit<UserTransactionRow, "created_at" | "completed_at"> & {
  created_at: Date | string;
  completed_at: Date | string | null;
};

type UserTransactionPacket = UserTransactionRow & RowDataPacket;

export async function insertCompletedPurchaseTransaction(params: {
  userId: number;
  planMonths: number;
  amountRub: number;
  provider: string;
  externalPaymentId?: string | null;
}): Promise<void> {
  const pool = getPool();
  const amount = Number(params.amountRub.toFixed(2));
  await pool.execute(
    `INSERT INTO user_transactions
      (user_id, amount_rub, plan_months, status, provider, external_payment_id, completed_at)
     VALUES (?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)`,
    [
      params.userId,
      amount,
      params.planMonths,
      params.provider,
      params.externalPaymentId?.trim() || null,
    ],
  );
}

export async function hasCompletedPurchaseByExternalId(externalPaymentId: string): Promise<boolean> {
  const id = externalPaymentId.trim();
  if (!id) return false;
  const pool = getPool();
  const [rows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    `SELECT COUNT(*) AS c FROM user_transactions
     WHERE external_payment_id = ? AND status = 'completed' LIMIT 1`,
    [id],
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

export async function listUserTransactions(
  userId: number,
  limit = 50,
): Promise<UserTransactionRow[]> {
  const pool = getPool();
  const [rows] = await pool.execute<UserTransactionPacket[]>(
    `SELECT id, user_id, amount_rub, plan_months, status, provider, external_payment_id, created_at, completed_at
     FROM user_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, Math.min(Math.max(limit, 1), 100)],
  );
  return rows;
}

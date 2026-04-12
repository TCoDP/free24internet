import type { ResultSetHeader } from "mysql2";
import { getPool } from "@/lib/db/mysql";

/**
 * Зачислить рубли на users.balance по tg_id (та же БД и пул, что у сайта).
 * Нужна миграция 015; строка с этим tg_id должна существовать.
 */
export async function creditUserBalanceRubByTgId(
  tgId: number,
  amountRub: number,
): Promise<{ ok: true } | { ok: false }> {
  const pool = getPool();
  const amount = Math.round(Number(amountRub));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false };
  const [res] = await pool.execute<ResultSetHeader>(
    "UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE tg_id = ?",
    [amount, tgId],
  );
  if (res.affectedRows === 0) return { ok: false };
  return { ok: true };
}

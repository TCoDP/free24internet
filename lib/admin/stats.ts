import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";

export type AdminDashboardStats = {
  users: number;
  ticketsOpen: number;
  ticketsTotal: number;
  transactionsCompleted: number;
  referralRewards: number;
};

export async function adminDashboardStats(): Promise<AdminDashboardStats> {
  const pool = getPool();
  const q = async (sql: string) => {
    const [rows] = await pool.execute<({ c: number } & RowDataPacket)[]>(sql);
    return Number(rows[0]?.c ?? 0);
  };

  const [users, ticketsOpen, ticketsTotal, transactionsCompleted, referralRewards] =
    await Promise.all([
      q("SELECT COUNT(*) AS c FROM users"),
      q(
        "SELECT COUNT(*) AS c FROM support_tickets WHERE status IN ('open', 'in_progress')",
      ),
      q("SELECT COUNT(*) AS c FROM support_tickets"),
      q("SELECT COUNT(*) AS c FROM user_transactions WHERE status = 'completed'"),
      q("SELECT COUNT(*) AS c FROM referral_rewards"),
    ]);

  return {
    users,
    ticketsOpen,
    ticketsTotal,
    transactionsCompleted,
    referralRewards,
  };
}

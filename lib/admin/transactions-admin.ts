import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { SortDir } from "@/lib/admin/table-params";
import type { UserTransactionRow } from "@/lib/payments/transactions";

type Packet = UserTransactionRow & RowDataPacket;

export type AdminTxSortKey =
  | "id"
  | "user_id"
  | "amount_rub"
  | "plan_months"
  | "provider"
  | "created_at"
  | "completed_at";

const TX_SORT: Record<AdminTxSortKey, string> = {
  id: "id",
  user_id: "user_id",
  amount_rub: "amount_rub",
  plan_months: "plan_months",
  provider: "provider",
  created_at: "created_at",
  completed_at: "completed_at",
};

function txOrderBy(sort: string | undefined, dir: SortDir): string {
  const key = sort && sort in TX_SORT ? (sort as AdminTxSortKey) : "created_at";
  const col = TX_SORT[key];
  const d = dir === "asc" ? "ASC" : "DESC";
  return `${col} ${d}, id DESC`;
}

export async function adminListTransactions(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  sortDir?: SortDir;
}): Promise<{ rows: UserTransactionRow[]; total: number }> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(10, params.pageSize));
  const offset = (page - 1) * pageSize;
  const pool = getPool();
  const term = params.q?.trim();
  const order = txOrderBy(params.sort, params.sortDir ?? "desc");

  if (term) {
    const like = `%${term.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
      `SELECT COUNT(*) AS c FROM user_transactions WHERE
        CAST(id AS CHAR) LIKE ? OR CAST(user_id AS CHAR) LIKE ? OR CAST(amount_rub AS CHAR) LIKE ?
        OR CAST(plan_months AS CHAR) LIKE ? OR provider LIKE ? OR IFNULL(external_payment_id,'') LIKE ?`,
      [like, like, like, like, like, like],
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.execute<Packet[]>(
      `SELECT id, user_id, amount_rub, plan_months, status, provider, external_payment_id, created_at, completed_at
       FROM user_transactions WHERE
        CAST(id AS CHAR) LIKE ? OR CAST(user_id AS CHAR) LIKE ? OR CAST(amount_rub AS CHAR) LIKE ?
        OR CAST(plan_months AS CHAR) LIKE ? OR provider LIKE ? OR IFNULL(external_payment_id,'') LIKE ?
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [like, like, like, like, like, like, pageSize, offset],
    );
    return { rows, total };
  }

  const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    "SELECT COUNT(*) AS c FROM user_transactions",
  );
  const total = Number(countRows[0]?.c ?? 0);
  const [rows] = await pool.execute<Packet[]>(
    `SELECT id, user_id, amount_rub, plan_months, status, provider, external_payment_id, created_at, completed_at
     FROM user_transactions
     ORDER BY ${order}
     LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  return { rows, total };
}

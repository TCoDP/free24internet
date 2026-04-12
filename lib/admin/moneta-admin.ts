import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { SortDir } from "@/lib/admin/table-params";

export type MonetaSessionRow = {
  id: number;
  mnt_transaction_id: string;
  user_id: number;
  plan_months: number;
  referral_code: string | null;
  amount_rub: string;
  created_at: Date;
  completed_at: Date | null;
};

type Packet = MonetaSessionRow & RowDataPacket;

export type AdminMonetaSortKey =
  | "id"
  | "user_id"
  | "mnt_transaction_id"
  | "amount_rub"
  | "plan_months"
  | "created_at"
  | "completed_at";

const MONETA_SORT: Record<AdminMonetaSortKey, string> = {
  id: "id",
  user_id: "user_id",
  mnt_transaction_id: "mnt_transaction_id",
  amount_rub: "amount_rub",
  plan_months: "plan_months",
  created_at: "created_at",
  completed_at: "completed_at",
};

function monetaOrderBy(sort: string | undefined, dir: SortDir): string {
  const key = sort && sort in MONETA_SORT ? (sort as AdminMonetaSortKey) : "created_at";
  const col = MONETA_SORT[key];
  const d = dir === "asc" ? "ASC" : "DESC";
  return `${col} ${d}, id DESC`;
}

export async function adminListMonetaSessions(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  sortDir?: SortDir;
}): Promise<{ rows: MonetaSessionRow[]; total: number }> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(10, params.pageSize));
  const offset = (page - 1) * pageSize;
  const pool = getPool();
  const term = params.q?.trim();
  const order = monetaOrderBy(params.sort, params.sortDir ?? "desc");

  if (term) {
    const like = `%${term.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
      `SELECT COUNT(*) AS c FROM moneta_checkout_sessions WHERE
        CAST(id AS CHAR) LIKE ? OR CAST(user_id AS CHAR) LIKE ? OR mnt_transaction_id LIKE ?
        OR CAST(amount_rub AS CHAR) LIKE ? OR CAST(plan_months AS CHAR) LIKE ?
        OR IFNULL(referral_code,'') LIKE ?`,
      [like, like, like, like, like, like],
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.execute<Packet[]>(
      `SELECT id, mnt_transaction_id, user_id, plan_months, referral_code, amount_rub, created_at, completed_at
       FROM moneta_checkout_sessions WHERE
        CAST(id AS CHAR) LIKE ? OR CAST(user_id AS CHAR) LIKE ? OR mnt_transaction_id LIKE ?
        OR CAST(amount_rub AS CHAR) LIKE ? OR CAST(plan_months AS CHAR) LIKE ?
        OR IFNULL(referral_code,'') LIKE ?
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [like, like, like, like, like, like, pageSize, offset],
    );
    return { rows, total };
  }

  const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    "SELECT COUNT(*) AS c FROM moneta_checkout_sessions",
  );
  const total = Number(countRows[0]?.c ?? 0);
  const [rows] = await pool.execute<Packet[]>(
    `SELECT id, mnt_transaction_id, user_id, plan_months, referral_code, amount_rub, created_at, completed_at
     FROM moneta_checkout_sessions
     ORDER BY ${order}
     LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  return { rows, total };
}

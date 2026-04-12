import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { SortDir } from "@/lib/admin/table-params";

export type ReferralRewardListRow = {
  id: number;
  referrer_user_id: number;
  referee_user_id: number;
  plan_months: number;
  bonus_days: number;
  created_at: Date;
};

type Packet = ReferralRewardListRow & RowDataPacket;

export type AdminReferralSortKey = "id" | "referrer_user_id" | "referee_user_id" | "plan_months" | "bonus_days" | "created_at";

const REF_SORT: Record<AdminReferralSortKey, string> = {
  id: "id",
  referrer_user_id: "referrer_user_id",
  referee_user_id: "referee_user_id",
  plan_months: "plan_months",
  bonus_days: "bonus_days",
  created_at: "created_at",
};

function refOrderBy(sort: string | undefined, dir: SortDir): string {
  const key = sort && sort in REF_SORT ? (sort as AdminReferralSortKey) : "created_at";
  const col = REF_SORT[key];
  const d = dir === "asc" ? "ASC" : "DESC";
  return `${col} ${d}, id DESC`;
}

export async function adminListReferralRewards(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  sortDir?: SortDir;
}): Promise<{ rows: ReferralRewardListRow[]; total: number }> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(10, params.pageSize));
  const offset = (page - 1) * pageSize;
  const pool = getPool();
  const term = params.q?.trim();
  const order = refOrderBy(params.sort, params.sortDir ?? "desc");

  if (term) {
    const like = `%${term.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
      `SELECT COUNT(*) AS c FROM referral_rewards WHERE
        CAST(id AS CHAR) LIKE ? OR CAST(referrer_user_id AS CHAR) LIKE ? OR CAST(referee_user_id AS CHAR) LIKE ?
        OR CAST(plan_months AS CHAR) LIKE ? OR CAST(bonus_days AS CHAR) LIKE ?`,
      [like, like, like, like, like],
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.execute<Packet[]>(
      `SELECT id, referrer_user_id, referee_user_id, plan_months, bonus_days, created_at
       FROM referral_rewards WHERE
        CAST(id AS CHAR) LIKE ? OR CAST(referrer_user_id AS CHAR) LIKE ? OR CAST(referee_user_id AS CHAR) LIKE ?
        OR CAST(plan_months AS CHAR) LIKE ? OR CAST(bonus_days AS CHAR) LIKE ?
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [like, like, like, like, like, pageSize, offset],
    );
    return { rows, total };
  }

  const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    "SELECT COUNT(*) AS c FROM referral_rewards",
  );
  const total = Number(countRows[0]?.c ?? 0);
  const [rows] = await pool.execute<Packet[]>(
    `SELECT id, referrer_user_id, referee_user_id, plan_months, bonus_days, created_at
     FROM referral_rewards
     ORDER BY ${order}
     LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  return { rows, total };
}

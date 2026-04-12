import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import { isProtectedSuperadminUserId } from "@/lib/auth/admin-access";
import type { SortDir } from "@/lib/admin/table-params";
export type AdminUserListRow = {
  id: number;
  email: string | null;
  name: string | null;
  tg_username: string | null;
  language: string | null;
  created_at: Date;
  subscription_until: Date | null;
  trial_ends_at: Date | null;
  referral_code: string | null;
  referred_by_user_id: number | null;
  is_their: number;
  is_admin: number;
};

type ListPacket = AdminUserListRow & RowDataPacket;

const LIST_SELECT = `id, email, name, tg_username, language, created_at,
  subscription_until, trial_ends_at, referral_code, referred_by_user_id,
  COALESCE(is_their, 0) AS is_their, COALESCE(is_admin, 0) AS is_admin`;

export type AdminUserSortKey = "id" | "email" | "name" | "subscription_until" | "created_at" | "is_admin";

const USER_SORT_COLS: Record<AdminUserSortKey, string> = {
  id: "id",
  email: "email",
  name: "name",
  subscription_until: "subscription_until",
  created_at: "created_at",
  is_admin: "is_admin",
};

function usersOrderBy(sort: string | undefined, dir: SortDir): string {
  const key =
    sort && sort in USER_SORT_COLS ? (sort as AdminUserSortKey) : "id";
  const col = USER_SORT_COLS[key];
  const d = dir === "asc" ? "ASC" : "DESC";
  return `${col} ${d}, id DESC`;
}

export async function adminListUsers(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  sortDir?: SortDir;
}): Promise<{ rows: AdminUserListRow[]; total: number }> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(10, params.pageSize));
  const offset = (page - 1) * pageSize;
  const pool = getPool();
  const term = params.q?.trim();
  const order = usersOrderBy(params.sort, params.sortDir ?? "desc");

  if (term) {
    const like = `%${term.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
      `SELECT COUNT(*) AS c FROM users WHERE
        CAST(id AS CHAR) LIKE ? OR email LIKE ? OR name LIKE ? OR tg_username LIKE ? OR referral_code LIKE ?`,
      [like, like, like, like, like],
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.execute<ListPacket[]>(
      `SELECT ${LIST_SELECT} FROM users WHERE
        CAST(id AS CHAR) LIKE ? OR email LIKE ? OR name LIKE ? OR tg_username LIKE ? OR referral_code LIKE ?
       ORDER BY ${order} LIMIT ? OFFSET ?`,
      [like, like, like, like, like, pageSize, offset],
    );
    return { rows, total };
  }

  const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    "SELECT COUNT(*) AS c FROM users",
  );
  const total = Number(countRows[0]?.c ?? 0);
  const [rows] = await pool.execute<ListPacket[]>(
    `SELECT ${LIST_SELECT} FROM users ORDER BY ${order} LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  return { rows, total };
}

export type AdminUserUpdateBody = {
  name?: string | null;
  language?: "ru" | "en" | "" | null;
  is_their?: boolean | number;
  is_admin?: boolean | number;
  subscription_until?: string | null;
  trial_ends_at?: string | null;
  referred_by_user_id?: number | "" | null;
  referral_code?: string | null;
};

function toMysqlDateTime(iso: string | null | undefined): string | null {
  if (iso == null || iso === "") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function adminUpdateUser(
  userId: number,
  body: AdminUserUpdateBody,
): Promise<"ok" | "referral_taken" | "cannot_demote_superadmin"> {
  if (isProtectedSuperadminUserId(userId)) {
    const wantDemote =
      body.is_admin === false ||
      body.is_admin === 0 ||
      (typeof body.is_admin === "string" && body.is_admin === "0");
    if (wantDemote) return "cannot_demote_superadmin";
  }

  const pool = getPool();

  if (body.referral_code !== undefined && body.referral_code != null) {
    const code = body.referral_code.trim().toUpperCase();
    if (code.length > 0) {
      const [dup] = await pool.execute<({ id: number } & RowDataPacket)[]>(
        "SELECT id FROM users WHERE referral_code = ? AND id <> ? LIMIT 1",
        [code, userId],
      );
      if (dup[0]) return "referral_taken";
    }
  }

  const parts: string[] = [];
  const vals: unknown[] = [];

  if ("name" in body) {
    parts.push("name = ?");
    vals.push(body.name?.trim() || null);
  }
  if ("language" in body) {
    const l = body.language;
    parts.push("language = ?");
    vals.push(l === "ru" || l === "en" ? l : null);
  }
  if ("is_their" in body) {
    parts.push("is_their = ?");
    vals.push(body.is_their ? 1 : 0);
  }
  if ("is_admin" in body) {
    parts.push("is_admin = ?");
    vals.push(body.is_admin ? 1 : 0);
  }
  if ("subscription_until" in body) {
    parts.push("subscription_until = ?");
    vals.push(toMysqlDateTime(body.subscription_until ?? null));
  }
  if ("trial_ends_at" in body) {
    parts.push("trial_ends_at = ?");
    vals.push(toMysqlDateTime(body.trial_ends_at ?? null));
  }
  if ("referred_by_user_id" in body) {
    const v = body.referred_by_user_id;
    let ref: number | null = null;
    if (v !== "" && v != null) {
      const n = Number(v);
      ref = Number.isFinite(n) && n > 0 ? n : null;
    }
    parts.push("referred_by_user_id = ?");
    vals.push(ref);
  }
  if ("referral_code" in body) {
    const c = body.referral_code?.trim();
    parts.push("referral_code = ?");
    vals.push(c && c.length > 0 ? c.toUpperCase() : null);
  }

  if (!parts.length) return "ok";

  vals.push(userId);
  await pool.execute(`UPDATE users SET ${parts.join(", ")} WHERE id = ?`, vals as (string | number | null)[]);
  return "ok";
}

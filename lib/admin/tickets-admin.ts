import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { SortDir } from "@/lib/admin/table-params";
import type { SupportTicketRow, TicketStatus } from "@/lib/support/types";

export type AdminTicketListRow = SupportTicketRow & {
  user_email: string | null;
  user_name: string | null;
};

type Packet = AdminTicketListRow & RowDataPacket;

export type AdminTicketSortKey = "id" | "user_id" | "subject" | "status" | "created_at" | "updated_at";

const TICKET_SORT: Record<AdminTicketSortKey, string> = {
  id: "t.id",
  user_id: "t.user_id",
  subject: "t.subject",
  status: "t.status",
  created_at: "t.created_at",
  updated_at: "t.updated_at",
};

function ticketsOrderBy(sort: string | undefined, dir: SortDir): string {
  const key =
    sort && sort in TICKET_SORT ? (sort as AdminTicketSortKey) : "created_at";
  const col = TICKET_SORT[key];
  const d = dir === "asc" ? "ASC" : "DESC";
  return `${col} ${d}, t.id DESC`;
}

export async function adminListTickets(params: {
  page: number;
  pageSize: number;
  q?: string;
  sort?: string;
  sortDir?: SortDir;
}): Promise<{ rows: AdminTicketListRow[]; total: number }> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(10, params.pageSize));
  const offset = (page - 1) * pageSize;
  const pool = getPool();
  const term = params.q?.trim();
  const order = ticketsOrderBy(params.sort, params.sortDir ?? "desc");

  const baseFrom = `FROM support_tickets t
     LEFT JOIN users u ON u.id = t.user_id`;

  if (term) {
    const like = `%${term.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
      `SELECT COUNT(*) AS c ${baseFrom} WHERE
        CAST(t.id AS CHAR) LIKE ? OR CAST(t.user_id AS CHAR) LIKE ? OR t.subject LIKE ? OR t.body LIKE ?
        OR u.email LIKE ? OR u.name LIKE ?`,
      [like, like, like, like, like, like],
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.execute<Packet[]>(
      `SELECT t.id, t.user_id, t.subject, t.body, t.status, t.created_at, t.updated_at,
              u.email AS user_email, u.name AS user_name
       ${baseFrom}
       WHERE
        CAST(t.id AS CHAR) LIKE ? OR CAST(t.user_id AS CHAR) LIKE ? OR t.subject LIKE ? OR t.body LIKE ?
        OR u.email LIKE ? OR u.name LIKE ?
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [like, like, like, like, like, like, pageSize, offset],
    );
    return { rows, total };
  }

  const [countRows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    `SELECT COUNT(*) AS c ${baseFrom}`,
  );
  const total = Number(countRows[0]?.c ?? 0);
  const [rows] = await pool.execute<Packet[]>(
    `SELECT t.id, t.user_id, t.subject, t.body, t.status, t.created_at, t.updated_at,
            u.email AS user_email, u.name AS user_name
     ${baseFrom}
     ORDER BY ${order}
     LIMIT ? OFFSET ?`,
    [pageSize, offset],
  );
  return { rows, total };
}

export async function adminGetTicket(ticketId: number): Promise<AdminTicketListRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<Packet[]>(
    `SELECT t.id, t.user_id, t.subject, t.body, t.status, t.created_at, t.updated_at,
            u.email AS user_email, u.name AS user_name
     FROM support_tickets t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.id = ? LIMIT 1`,
    [ticketId],
  );
  return rows[0] ?? null;
}

export async function adminUpdateTicketStatus(
  ticketId: number,
  status: TicketStatus,
): Promise<boolean> {
  const pool = getPool();
  const [res] = await pool.execute<ResultSetHeader>(
    "UPDATE support_tickets SET status = ? WHERE id = ?",
    [status, ticketId],
  );
  return res.affectedRows > 0;
}

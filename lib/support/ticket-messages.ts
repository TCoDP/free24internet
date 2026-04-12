import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";

export type TicketMessageAuthorRole = "user" | "admin";

export type SupportTicketMessageRow = {
  id: number;
  ticket_id: number;
  author_role: TicketMessageAuthorRole;
  author_user_id: number;
  body: string;
  created_at: Date;
};

type Packet = SupportTicketMessageRow & RowDataPacket;

export async function listMessagesForTicket(ticketId: number): Promise<SupportTicketMessageRow[]> {
  const pool = getPool();
  const [rows] = await pool.execute<Packet[]>(
    `SELECT id, ticket_id, author_role, author_user_id, body, created_at
     FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC, id ASC`,
    [ticketId],
  );
  return rows;
}

export async function addTicketMessage(
  ticketId: number,
  role: TicketMessageAuthorRole,
  authorUserId: number,
  body: string,
): Promise<number> {
  const pool = getPool();
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO support_ticket_messages (ticket_id, author_role, author_user_id, body) VALUES (?, ?, ?, ?)`,
    [ticketId, role, authorUserId, body],
  );
  const id = Number(res.insertId);
  if (role === "user") {
    await pool.execute(
      `UPDATE support_tickets
       SET status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [ticketId],
    );
  } else {
    await pool.execute(`UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [ticketId]);
  }
  return id;
}

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { SupportTicketRow } from "./types";

type TicketPacket = SupportTicketRow & RowDataPacket;

export async function listTicketsForUser(userId: number): Promise<SupportTicketRow[]> {
  const pool = getPool();
  const [rows] = await pool.execute<TicketPacket[]>(
    `SELECT id, user_id, subject, body, status, created_at, updated_at
     FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getTicketForUser(
  ticketId: number,
  userId: number,
): Promise<SupportTicketRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<TicketPacket[]>(
    `SELECT id, user_id, subject, body, status, created_at, updated_at
     FROM support_tickets WHERE id = ? AND user_id = ? LIMIT 1`,
    [ticketId, userId],
  );
  return rows[0] ?? null;
}

export async function createSupportTicket(
  userId: number,
  subject: string,
  body: string,
): Promise<number> {
  const pool = getPool();
  const [res] = await pool.execute<ResultSetHeader>(
    "INSERT INTO support_tickets (user_id, subject, body) VALUES (?, ?, ?)",
    [userId, subject, body],
  );
  return Number(res.insertId);
}

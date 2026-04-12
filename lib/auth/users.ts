import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import type { UserRow } from "./types";

type UserRowPacket = UserRow & RowDataPacket;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRowPacket[]>(
    "SELECT id, email, password_hash, name, created_at FROM fi_users WHERE email = ? LIMIT 1",
    [email.toLowerCase().trim()],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string | null,
): Promise<number> {
  const pool = getPool();
  const [res] = await pool.execute<ResultSetHeader>(
    "INSERT INTO fi_users (email, password_hash, name) VALUES (?, ?, ?)",
    [email.toLowerCase().trim(), passwordHash, name?.trim() || null],
  );
  return res.insertId;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRowPacket[]>(
    "SELECT id, email, password_hash, name, created_at FROM fi_users WHERE id = ? LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

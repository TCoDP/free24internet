import { randomBytes } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import type { UserRow } from "./types";

type UserRowPacket = UserRow & RowDataPacket;

const USER_SELECT = `id, tg_id, email, password_hash, name, tg_username, language, created_at,
  referral_code, referred_by_user_id, subscription_until, trial_ends_at, is_their, is_admin`;

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function generateReferralCodeString(): string {
  const bytes = randomBytes(8);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += REFERRAL_ALPHABET[bytes[i]! % REFERRAL_ALPHABET.length]!;
  }
  return `F24${suffix}`;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRowPacket[]>(
    `SELECT ${USER_SELECT} FROM users WHERE email = ? LIMIT 1`,
    [email.toLowerCase().trim()],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string | null,
  options?: { referredByUserId?: number | null },
): Promise<number> {
  const pool = getPool();
  const trialDays = (await getPricingConfig()).trialDays;
  const ref = options?.referredByUserId;
  if (ref != null && ref > 0) {
    const [res] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, name, trial_ends_at, referred_by_user_id)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?)`,
      [email.toLowerCase().trim(), passwordHash, name?.trim() || null, trialDays, ref],
    );
    return res.insertId;
  }
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, name, trial_ends_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [email.toLowerCase().trim(), passwordHash, name?.trim() || null, trialDays],
  );
  return res.insertId;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRowPacket[]>(
    `SELECT ${USER_SELECT} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findUserByTgId(tgId: number): Promise<UserRow | null> {
  const pool = getPool();
  const [rows] = await pool.execute<UserRowPacket[]>(
    `SELECT ${USER_SELECT} FROM users WHERE tg_id = ? LIMIT 1`,
    [tgId],
  );
  return rows[0] ?? null;
}

/** Для существующих аккаунтов до миграции 007: выставить конец пробного периода от даты регистрации. */
export async function ensureUserTrialInitialized(userId: number): Promise<void> {
  const trialDays = (await getPricingConfig()).trialDays;
  const pool = getPool();
  await pool.execute(
    `UPDATE users SET trial_ends_at = DATE_ADD(created_at, INTERVAL ? DAY)
     WHERE id = ? AND trial_ends_at IS NULL`,
    [trialDays, userId],
  );
}

export async function findUserIdByReferralCode(code: string): Promise<number | null> {
  const n = normalizeReferralCode(code);
  if (!n) return null;
  const pool = getPool();
  const [rows] = await pool.execute<({ id: number } & RowDataPacket)[]>(
    "SELECT id FROM users WHERE referral_code = ? LIMIT 1",
    [n],
  );
  const id = rows[0]?.id;
  return id != null ? Number(id) : null;
}

export async function ensureReferralCode(userId: number): Promise<string> {
  const existing = await findUserById(userId);
  if (existing?.referral_code) return existing.referral_code;

  const pool = getPool();
  for (let attempt = 0; attempt < 16; attempt++) {
    const code = generateReferralCodeString();
    try {
      const [res] = await pool.execute<ResultSetHeader>(
        "UPDATE users SET referral_code = ? WHERE id = ? AND referral_code IS NULL",
        [code, userId],
      );
      if (res.affectedRows > 0) return code;
      const again = await findUserById(userId);
      if (again?.referral_code) return again.referral_code;
    } catch {
      /* дубликат referral_code — пробуем снова */
    }
  }
  throw new Error("referral_code_generation_failed");
}

export async function setReferredByIfEmpty(
  userId: number,
  rawCode: string,
): Promise<"ok" | "already" | "self" | "invalid"> {
  const referrerId = await findUserIdByReferralCode(rawCode);
  if (!referrerId) return "invalid";
  if (referrerId === userId) return "self";

  const pool = getPool();
  const [rows] = await pool.execute<({ referred_by_user_id: number | null } & RowDataPacket)[]>(
    "SELECT referred_by_user_id FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (!rows[0]) return "invalid";
  if (rows[0].referred_by_user_id != null) return "already";

  await pool.execute("UPDATE users SET referred_by_user_id = ? WHERE id = ?", [referrerId, userId]);
  return "ok";
}

export async function countUsersReferredBy(referrerId: number): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.execute<({ c: number } & RowDataPacket)[]>(
    "SELECT COUNT(*) AS c FROM users WHERE referred_by_user_id = ?",
    [referrerId],
  );
  return Number(rows[0]?.c ?? 0);
}

export async function sumReferralBonusDaysGranted(referrerId: number): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.execute<({ s: number | null } & RowDataPacket)[]>(
    "SELECT COALESCE(SUM(bonus_days), 0) AS s FROM referral_rewards WHERE referrer_user_id = ?",
    [referrerId],
  );
  return Number(rows[0]?.s ?? 0);
}

export async function updateUserProfile(
  id: number,
  patch: { name?: string | null; language?: "ru" | "en" },
): Promise<void> {
  const pool = getPool();
  const parts: string[] = [];
  const vals: unknown[] = [];
  if ("name" in patch) {
    parts.push("name = ?");
    vals.push(patch.name);
  }
  if (patch.language !== undefined) {
    parts.push("language = ?");
    vals.push(patch.language);
  }
  if (!parts.length) return;
  vals.push(id);
  await pool.execute(`UPDATE users SET ${parts.join(", ")} WHERE id = ?`, vals as (string | number | null)[]);
}

export async function updateUserPasswordHash(id: number, passwordHash: string): Promise<void> {
  const pool = getPool();
  await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
}

type IdRowPacket = { id: number } & RowDataPacket;

/**
 * Привязка Telegram Login Widget к существующему пользователю (например, вошёл по email).
 * Не трогаем name — только tg_*.
 */
export async function linkTelegramToProfile(
  userId: number,
  params: {
    tgId: number;
    tgUsername: string | null;
    firstName: string;
    lastName: string | null;
  },
): Promise<"ok" | "tg_taken" | "user_not_found"> {
  const pool = getPool();
  const [owners] = await pool.execute<IdRowPacket[]>(
    "SELECT id FROM users WHERE tg_id = ? LIMIT 1",
    [params.tgId],
  );
  const owner = owners[0];
  if (owner && Number(owner.id) !== userId) return "tg_taken";

  const [self] = await pool.execute<IdRowPacket[]>("SELECT id FROM users WHERE id = ? LIMIT 1", [
    userId,
  ]);
  if (!self[0]) return "user_not_found";

  await pool.execute(
    `UPDATE users SET
      tg_id = ?,
      tg_username = ?,
      tg_first_name = ?,
      tg_last_name = ?
    WHERE id = ?`,
    [
      params.tgId,
      params.tgUsername,
      params.firstName.trim(),
      params.lastName?.trim() ?? null,
      userId,
    ],
  );
  return "ok";
}

type TgUserRow = {
  id: number;
  email: string | null;
  name: string | null;
  tg_username: string | null;
};

type TgUserRowPacket = TgUserRow & RowDataPacket;

/** Создание или обновление пользователя по данным Telegram Login Widget (общая таблица с ботом). */
export async function upsertTelegramUser(params: {
  tgId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  displayName: string;
}): Promise<TgUserRow> {
  const pool = getPool();
  const tgUsername = params.username?.trim() || null;
  const first = params.firstName.trim() || "";
  const last = params.lastName?.trim() || null;
  const display = params.displayName.trim() || "Telegram";

  const [existing] = await pool.execute<TgUserRowPacket[]>(
    "SELECT id, email, name, tg_username FROM users WHERE tg_id = ? LIMIT 1",
    [params.tgId],
  );
  const row = existing[0];

  if (row) {
    await pool.execute(
      `UPDATE users SET
        tg_username = COALESCE(?, tg_username),
        tg_first_name = ?,
        tg_last_name = ?,
        name = ?
      WHERE tg_id = ?`,
      [tgUsername, first, last, display, params.tgId],
    );
    const [again] = await pool.execute<TgUserRowPacket[]>(
      "SELECT id, email, name, tg_username FROM users WHERE tg_id = ? LIMIT 1",
      [params.tgId],
    );
    return again[0]!;
  }

  const trialDays = (await getPricingConfig()).trialDays;
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (tg_id, tg_username, tg_first_name, tg_last_name, name, language, trial_ends_at)
     VALUES (?, ?, ?, ?, ?, 'ru', DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [params.tgId, tgUsername, first, last, display, trialDays],
  );
  const [inserted] = await pool.execute<TgUserRowPacket[]>(
    "SELECT id, email, name, tg_username FROM users WHERE id = ? LIMIT 1",
    [res.insertId],
  );
  return inserted[0]!;
}

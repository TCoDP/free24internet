import { randomBytes } from "crypto";
import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db/mysql";
import { linkTelegramToProfile } from "@/lib/auth/users";
import type { Locale } from "@/lib/messages/types";

type TokenRow = {
  id: number;
  token: string;
  user_id: number;
  locale: string;
  expires_at: Date;
  used_at: Date | null;
} & RowDataPacket;

const PREFIX = "lnk";
const TTL_MS = 15 * 60 * 1000;

function newTokenString(): string {
  const raw = randomBytes(18).toString("base64url");
  return `${PREFIX}${raw}`;
}

export async function issueTelegramLinkToken(
  userId: number,
  locale: Locale,
): Promise<{ token: string; expiresAt: Date }> {
  const pool = getPool();
  await pool.execute("DELETE FROM telegram_link_tokens WHERE user_id = ? AND used_at IS NULL", [
    userId,
  ]);
  const token = newTokenString();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await pool.execute(
    "INSERT INTO telegram_link_tokens (token, user_id, locale, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, locale, expiresAt],
  );
  return { token, expiresAt };
}

export type ConsumeLinkResult =
  | { ok: true; locale: string }
  | { ok: false; reason: "not_found" | "expired" | "used" | "tg_taken"; locale?: string };

/**
 * Проверка токена из /start и привязка Telegram к пользователю сайта.
 */
export async function consumeTelegramLinkToken(
  token: string,
  tg: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
  },
): Promise<ConsumeLinkResult> {
  const pool = getPool();
  const [rows] = await pool.execute<TokenRow[]>(
    `SELECT id, token, user_id, locale, expires_at, used_at
     FROM telegram_link_tokens WHERE token = ? LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return { ok: false, reason: "not_found" };

  const loc = row.locale === "en" ? "en" : "ru";

  if (row.used_at) return { ok: false, reason: "used", locale: loc };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: "expired", locale: loc };
  }

  const link = await linkTelegramToProfile(row.user_id, {
    tgId: tg.id,
    tgUsername: tg.username?.trim() || null,
    firstName: tg.first_name,
    lastName: tg.last_name?.trim() ?? null,
  });

  if (link === "tg_taken") {
    return { ok: false, reason: "tg_taken", locale: loc };
  }
  if (link === "user_not_found") {
    return { ok: false, reason: "not_found", locale: loc };
  }

  await pool.execute("UPDATE telegram_link_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [
    row.id,
  ]);
  return { ok: true, locale: loc };
}

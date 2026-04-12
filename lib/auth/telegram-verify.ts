import { createHash, createHmac } from "crypto";

/** Данные, которые отдаёт Telegram Login Widget после успешной авторизации. */
export type TelegramWidgetUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

const MAX_AUTH_AGE_SEC = 86400;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Проверка подписи по https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramWidgetPayload(
  raw: unknown,
  botToken: string,
): TelegramWidgetUser | null {
  if (!botToken || !isRecord(raw)) return null;

  const hash = raw.hash;
  if (typeof hash !== "string") return null;

  const authRaw = raw.auth_date;
  const authTs = typeof authRaw === "number" ? authRaw : Number(authRaw);
  if (!Number.isFinite(authTs)) return null;
  const now = Math.floor(Date.now() / 1000);
  if (now - authTs > MAX_AUTH_AGE_SEC || authTs > now + 60) return null;

  const pairs: string[] = [];
  for (const key of Object.keys(raw).sort()) {
    if (key === "hash") continue;
    pairs.push(`${key}=${raw[key]}`);
  }
  const checkString = pairs.join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const hmac = createHmac("sha256", secretKey).update(checkString).digest("hex");
  if (hmac !== hash) return null;

  const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const first_name = typeof raw.first_name === "string" ? raw.first_name : "";
  const last_name = typeof raw.last_name === "string" ? raw.last_name : undefined;
  const username = typeof raw.username === "string" ? raw.username : undefined;
  const photo_url = typeof raw.photo_url === "string" ? raw.photo_url : undefined;

  return {
    id,
    first_name,
    last_name,
    username,
    photo_url,
    auth_date: authTs,
    hash,
  };
}

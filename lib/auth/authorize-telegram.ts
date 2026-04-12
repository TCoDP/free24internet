import type { User } from "next-auth";
import { upsertTelegramUser } from "@/lib/auth/users";
import { verifyTelegramWidgetPayload } from "@/lib/auth/telegram-verify";

function displayName(tg: {
  first_name: string;
  last_name?: string;
  username?: string;
}): string {
  const full = [tg.first_name, tg.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (tg.username) return `@${tg.username}`;
  return "Telegram";
}

export async function authorizeTelegram(payloadJson: string): Promise<User | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson) as unknown;
  } catch {
    return null;
  }

  const tg = verifyTelegramWidgetPayload(parsed, botToken);
  if (!tg) return null;

  const row = await upsertTelegramUser({
    tgId: tg.id,
    username: tg.username ?? null,
    firstName: tg.first_name,
    lastName: tg.last_name ?? null,
    displayName: displayName(tg),
  });

  return {
    id: String(row.id),
    email: row.email ?? undefined,
    name: row.name ?? displayName(tg),
    tgUsername: row.tg_username ?? tg.username ?? null,
  };
}

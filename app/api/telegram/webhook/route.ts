import { NextResponse } from "next/server";
import { consumeTelegramLinkToken } from "@/lib/telegram/link-tokens";
import { telegramSendMessage } from "@/lib/telegram/bot-api";
import { telegramWebhookReplies } from "@/lib/telegram/webhook-messages";

export const runtime = "nodejs";

type TgUser = {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(req: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const got = req.headers.get("x-telegram-bot-api-secret-token");
  if (got !== expected) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isRecord(update)) {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!isRecord(message)) {
    return NextResponse.json({ ok: true });
  }

  const chat = message.chat;
  const from = message.from;
  if (!isRecord(chat) || !isRecord(from)) {
    return NextResponse.json({ ok: true });
  }

  const chatIdRaw = chat.id;
  const chatId = typeof chatIdRaw === "number" ? chatIdRaw : Number(chatIdRaw);
  if (!Number.isFinite(chatId)) {
    return NextResponse.json({ ok: true });
  }

  const textRaw = message.text;
  const text = typeof textRaw === "string" ? textRaw.trim() : "";
  if (!text.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const parts = text.split(/\s+/);
  const payload = parts.length > 1 ? parts[1]!.trim() : "";

  const tgUser: TgUser = {
    id: typeof from.id === "number" ? from.id : Number(from.id),
    username: typeof from.username === "string" ? from.username : undefined,
    first_name: typeof from.first_name === "string" ? from.first_name : "User",
    last_name: typeof from.last_name === "string" ? from.last_name : undefined,
  };

  const langFromTg =
    typeof from.language_code === "string" && from.language_code.toLowerCase().startsWith("en")
      ? "en"
      : "ru";

  if (!payload.startsWith("lnk")) {
    await telegramSendMessage(chatId, telegramWebhookReplies[langFromTg].plainStart);
    return NextResponse.json({ ok: true });
  }

  const result = await consumeTelegramLinkToken(payload, tgUser);
  const lang = result.locale === "en" ? "en" : "ru";
  const msg = telegramWebhookReplies[lang];

  if (result.ok) {
    await telegramSendMessage(chatId, msg.success);
  } else {
    switch (result.reason) {
      case "not_found":
        await telegramSendMessage(chatId, msg.notFound);
        break;
      case "expired":
        await telegramSendMessage(chatId, msg.expired);
        break;
      case "used":
        await telegramSendMessage(chatId, msg.used);
        break;
      case "tg_taken":
        await telegramSendMessage(chatId, msg.tgTaken);
        break;
      default:
        await telegramSendMessage(chatId, msg.notFound);
    }
  }

  return NextResponse.json({ ok: true });
}

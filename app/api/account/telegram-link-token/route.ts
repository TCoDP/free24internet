import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TELEGRAM_BOT_USERNAME } from "@/lib/constants";
import { findUserById } from "@/lib/auth/users";
import { issueTelegramLinkToken } from "@/lib/telegram/link-tokens";
import type { Locale } from "@/lib/messages/types";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 });
    }

    const row = await findUserById(userId);
    const locale: Locale =
      row?.language === "en" || row?.language === "ru" ? row.language : "ru";

    const { token, expiresAt } = await issueTelegramLinkToken(userId, locale);
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(token)}`;

    return NextResponse.json({
      ok: true,
      token,
      deepLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e) {
    console.error("[account/telegram-link-token]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

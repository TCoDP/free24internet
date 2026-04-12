#!/usr/bin/env node
/**
 * Регистрирует HTTPS webhook у Bot API (secret_token = TELEGRAM_WEBHOOK_SECRET).
 *
 *   node --env-file=.env scripts/register-telegram-webhook.mjs
 */

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const base =
  process.env.AUTH_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  "";

if (!token || !secret || !base) {
  console.error(
    "Нужны TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и AUTH_URL (или NEXTAUTH_URL) с публичным HTTPS-адресом сайта.",
  );
  process.exit(1);
}

if (secret.length < 1 || secret.length > 256 || !/^[A-Za-z0-9_-]+$/.test(secret)) {
  console.error(
    "TELEGRAM_WEBHOOK_SECRET: Telegram допускает только A–Z, a–z, 0–9, _ и -, длина 1–256. Пример: node -e \"console.log(require('crypto').randomBytes(18).toString('base64url'))\"",
  );
  process.exit(1);
}

const normalized = base.replace(/\/$/, "");
const webhookUrl = `${normalized}/api/telegram/webhook`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message"],
  }),
});

const data = await res.json();
if (!data.ok) {
  console.error("setWebhook failed:", data);
  process.exit(1);
}

console.log("OK:", webhookUrl);

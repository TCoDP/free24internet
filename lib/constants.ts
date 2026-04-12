export const TELEGRAM_BOT_URL = "https://t.me/free24_internet_bot";

/** Имя бота без @ — для Telegram Login Widget. */
export const TELEGRAM_BOT_USERNAME =
  TELEGRAM_BOT_URL.match(/t\.me\/([^/?#]+)/)?.[1] ?? "free24_internet_bot";

export const SITE_ORIGIN = "https://free24internet.vip";

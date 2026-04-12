/** Тексты ответа бота в чат (после /start с токеном). */
export const telegramWebhookReplies = {
  ru: {
    success: "Готово: Telegram привязан к вашему аккаунту на сайте. Можете обновить страницу в браузере.",
    notFound: "Ссылка недействительна. Откройте сайт → личный кабинет → Профиль и создайте новую ссылку.",
    expired: "Ссылка устарела. Зайдите в кабинет на сайте и сгенерируйте привязку заново.",
    used: "Эта ссылка уже была использована. При необходимости создайте новую в кабинете на сайте.",
    tgTaken: "Этот Telegram уже привязан к другому аккаунту на сайте.",
    plainStart:
      "Чтобы привязать аккаунт, зайдите на сайт в личный кабинет → Профиль и нажмите «Открыть в Telegram».",
  },
  en: {
    success: "Done: your Telegram is linked to your site account. You can refresh the page in your browser.",
    notFound: "This link is invalid. Open the site → Account → Profile and create a new link.",
    expired: "This link has expired. Open your account on the site and generate a new one.",
    used: "This link was already used. Create a new one in your account on the site if needed.",
    tgTaken: "This Telegram account is already linked to another user on the site.",
    plainStart:
      "To link your account, open the site → Account → Profile and tap the button to open Telegram.",
  },
} as const;

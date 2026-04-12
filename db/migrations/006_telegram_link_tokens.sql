-- Одноразовые ссылки для привязки Telegram: сайт → t.me/bot?start=TOKEN → webhook → users.tg_id
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  locale VARCHAR(8) NOT NULL DEFAULT 'ru',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_telegram_link_token (token),
  KEY idx_telegram_link_user_unused (user_id, used_at),
  KEY idx_telegram_link_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Общая таблица с ботом: идентификаторы Telegram — tg_id, tg_username (как в боте).
-- Сайт: email, password_hash, name.
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tg_id BIGINT NULL,
  tg_username VARCHAR(64) NULL,
  email VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY tg_id (tg_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

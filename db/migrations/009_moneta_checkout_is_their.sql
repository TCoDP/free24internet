-- Оплата на сайте (Moneta / PayAnyWay): только пользователи с is_their = 1
-- Колонка добавляется идемпотентно (повторный запуск не падает на Duplicate column).

SELECT COUNT(*) INTO @fi_is_their_col
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'is_their';

SET @fi_add_is_their = IF(
  @fi_is_their_col = 0,
  'ALTER TABLE users ADD COLUMN is_their TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE fi_stmt_is_their FROM @fi_add_is_their;
EXECUTE fi_stmt_is_their;
DEALLOCATE PREPARE fi_stmt_is_their;

CREATE TABLE IF NOT EXISTS moneta_checkout_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mnt_transaction_id VARCHAR(255) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  plan_months TINYINT UNSIGNED NOT NULL,
  referral_code VARCHAR(64) NULL,
  amount_rub DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_moneta_mnt_tx (mnt_transaction_id),
  KEY idx_moneta_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

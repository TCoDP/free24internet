-- История оплат и будущие pending от внешнего платёжного провайдера
CREATE TABLE IF NOT EXISTS user_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  amount_rub DECIMAL(10, 2) NOT NULL,
  plan_months TINYINT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'completed',
  provider VARCHAR(64) NOT NULL,
  external_payment_id VARCHAR(191) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  KEY idx_ut_user_created (user_id, created_at),
  KEY idx_ut_external (provider, external_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

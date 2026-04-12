-- Реферальные коды, пробный период, оплаченная подписка, история бонусов пригласившему
ALTER TABLE users ADD COLUMN referral_code VARCHAR(32) NULL;
CREATE UNIQUE INDEX uq_users_referral_code ON users (referral_code);

ALTER TABLE users ADD COLUMN referred_by_user_id INT UNSIGNED NULL;
ALTER TABLE users ADD KEY idx_users_referred_by (referred_by_user_id);

ALTER TABLE users ADD COLUMN subscription_until TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP NULL;

CREATE TABLE IF NOT EXISTS referral_rewards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  referrer_user_id INT UNSIGNED NOT NULL,
  referee_user_id INT UNSIGNED NOT NULL,
  plan_months TINYINT UNSIGNED NOT NULL,
  bonus_days SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rr_referrer (referrer_user_id),
  KEY idx_rr_referee (referee_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

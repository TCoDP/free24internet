-- Глобальные настройки цен и сроки пробного периода
CREATE TABLE IF NOT EXISTS pricing_global (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  base_monthly_rub INT UNSIGNED NOT NULL DEFAULT 60,
  trial_days SMALLINT UNSIGNED NOT NULL DEFAULT 7
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO pricing_global (id, base_monthly_rub, trial_days) VALUES (1, 60, 7);

-- Тарифные сроки: месяцы, скидка (доля 0..1), бонус рефереру в днях
CREATE TABLE IF NOT EXISTS pricing_plan_terms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  months INT UNSIGNED NOT NULL,
  discount_rate DECIMAL(8, 5) NOT NULL DEFAULT 0,
  referrer_bonus_days SMALLINT UNSIGNED NOT NULL DEFAULT 7,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pricing_plan_months (months)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO pricing_plan_terms (months, discount_rate, referrer_bonus_days, sort_order, is_active) VALUES
(12, 0.15, 30, 10, 1),
(6, 0.1, 18, 20, 1),
(3, 0.05, 12, 30, 1),
(1, 0, 7, 40, 1);

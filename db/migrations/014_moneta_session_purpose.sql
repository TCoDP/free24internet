-- Тип сессии Moneta: plan (подписка на сайте) | balance (пополнение баланса в Telegram-боте)

SELECT COUNT(*) INTO @fi_purpose_col
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'moneta_checkout_sessions'
  AND COLUMN_NAME = 'purpose';

SET @fi_add_purpose = IF(
  @fi_purpose_col = 0,
  'ALTER TABLE moneta_checkout_sessions ADD COLUMN purpose VARCHAR(16) NOT NULL DEFAULT ''plan'' AFTER user_id',
  'SELECT 1'
);

PREPARE fi_stmt_purpose FROM @fi_add_purpose;
EXECUTE fi_stmt_purpose;
DEALLOCATE PREPARE fi_stmt_purpose;

-- Баланс для списаний в Telegram-боте: та же таблица users, что у сайта (общая БД).

SELECT COUNT(*) INTO @fi_balance_col
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'balance';

SET @fi_add_balance = IF(
  @fi_balance_col = 0,
  'ALTER TABLE users ADD COLUMN balance INT NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE fi_stmt_balance FROM @fi_add_balance;
EXECUTE fi_stmt_balance;
DEALLOCATE PREPARE fi_stmt_balance;

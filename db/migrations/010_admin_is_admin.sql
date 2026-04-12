-- Админка: флаг is_admin. Пользователь id=20 получает полный доступ (можно добавить других через UPDATE).

SELECT COUNT(*) INTO @fi_is_admin_col
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'is_admin';

SET @fi_add_is_admin = IF(
  @fi_is_admin_col = 0,
  'ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE fi_stmt_is_admin FROM @fi_add_is_admin;
EXECUTE fi_stmt_is_admin;
DEALLOCATE PREPARE fi_stmt_is_admin;

UPDATE users SET is_admin = 1 WHERE id = 20;

-- Убираем дубликаты: telegram_id → tg_id, username → tg_username (поля бота остаются).
DROP PROCEDURE IF EXISTS fi_drop_duplicate_telegram_columns;
CREATE PROCEDURE fi_drop_duplicate_telegram_columns()
proc: BEGIN
  DECLARE db VARCHAR(64);
  SET db = DATABASE();

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'telegram_id') > 0 THEN
    UPDATE users SET tg_id = telegram_id WHERE tg_id IS NULL AND telegram_id IS NOT NULL;
    IF (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = db AND table_name = 'users' AND index_name = 'uq_users_telegram_id') > 0 THEN
      ALTER TABLE users DROP INDEX uq_users_telegram_id;
    END IF;
    ALTER TABLE users DROP COLUMN telegram_id;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'username') > 0 THEN
    UPDATE users SET tg_username = LEFT(username, 64)
    WHERE (tg_username IS NULL OR TRIM(tg_username) = '') AND username IS NOT NULL AND TRIM(username) <> '';
    ALTER TABLE users DROP COLUMN username;
  END IF;
END proc;

CALL fi_drop_duplicate_telegram_columns();
DROP PROCEDURE IF EXISTS fi_drop_duplicate_telegram_columns;

-- Язык интерфейса / синхронизация с ботом (INSERT в upsertTelegramUser уже использует language).
DROP PROCEDURE IF EXISTS fi_add_user_language;
CREATE PROCEDURE fi_add_user_language()
proc: BEGIN
  DECLARE db VARCHAR(64);
  SET db = DATABASE();

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'language') = 0 THEN
    ALTER TABLE users ADD COLUMN language VARCHAR(8) NULL DEFAULT 'ru' AFTER name;
  END IF;
END proc;

CALL fi_add_user_language();
DROP PROCEDURE IF EXISTS fi_add_user_language;

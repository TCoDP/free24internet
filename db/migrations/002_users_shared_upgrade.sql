-- Приведение схемы к общей таблице users (переименование fi_users, недостающие колонки и индексы).
-- Дубли telegram_id/username не создаём — в боте уже есть tg_id / tg_username.
DROP PROCEDURE IF EXISTS fi_upgrade_users_shared;
CREATE PROCEDURE fi_upgrade_users_shared()
proc: BEGIN
  DECLARE db VARCHAR(64);
  DECLARE n_fi INT DEFAULT 0;
  DECLARE n_u INT DEFAULT 0;

  SET db = DATABASE();

  SELECT COUNT(*) INTO n_fi FROM information_schema.tables WHERE table_schema = db AND table_name = 'fi_users';
  SELECT COUNT(*) INTO n_u FROM information_schema.tables WHERE table_schema = db AND table_name = 'users';

  IF n_fi > 0 AND n_u = 0 THEN
    RENAME TABLE fi_users TO users;
  END IF;

  SELECT COUNT(*) INTO n_u FROM information_schema.tables WHERE table_schema = db AND table_name = 'users';

  IF n_u = 0 THEN
    CREATE TABLE users (
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
    LEAVE proc;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'tg_id') = 0 THEN
    ALTER TABLE users ADD COLUMN tg_id BIGINT NULL AFTER id;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'tg_username') = 0 THEN
    ALTER TABLE users ADD COLUMN tg_username VARCHAR(64) NULL AFTER tg_id;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'email') = 0 THEN
    ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'password_hash') = 0 THEN
    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'name') = 0 THEN
    ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'created_at') = 0 THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'updated_at') = 0 THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;
  END IF;

  IF (SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'email' LIMIT 1) = 'NO' THEN
    ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;
  END IF;

  IF (SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = db AND table_name = 'users' AND column_name = 'password_hash' LIMIT 1) = 'NO' THEN
    ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = db AND table_name = 'users' AND column_name = 'tg_id' AND non_unique = 0) = 0 THEN
    ALTER TABLE users ADD UNIQUE KEY tg_id (tg_id);
  END IF;

  IF (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = db AND table_name = 'users' AND column_name = 'email' AND non_unique = 0) = 0 THEN
    ALTER TABLE users ADD UNIQUE KEY uq_users_email (email);
  END IF;
END proc;

CALL fi_upgrade_users_shared();
DROP PROCEDURE IF EXISTS fi_upgrade_users_shared;

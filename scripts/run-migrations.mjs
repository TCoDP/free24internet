#!/usr/bin/env node
/**
 * Применяет SQL из db/migrations/*.sql по порядку, пишет учёт в fi_schema_migrations.
 *
 *   node --env-file=.env scripts/run-migrations.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "db", "migrations");

function getConnectionConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  if (!user || !database) {
    console.error(
      "Задайте DATABASE_URL или MYSQL_USER + MYSQL_DATABASE (+ MYSQL_HOST, MYSQL_PORT, MYSQL_PASSWORD).",
    );
    process.exit(1);
  }
  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password: process.env.MYSQL_PASSWORD ?? "",
    database,
  };
}

async function main() {
  const cfg = getConnectionConfig();
  const conn =
    typeof cfg === "string" ? await mysql.createConnection(cfg) : await mysql.createConnection(cfg);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS fi_schema_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_migration_file (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [rows] = await conn.query("SELECT filename FROM fi_schema_migrations");
  const list = Array.isArray(rows) ? rows : [];
  const applied = new Set(list.map((r) => r.filename));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("Нет файлов в db/migrations/");
    await conn.end();
    return;
  }

  for (const file of files) {
    if (applied.has(file)) {
      console.log("skip ", file);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log("apply", file);
    await conn.query(sql);
    await conn.query("INSERT INTO fi_schema_migrations (filename) VALUES (?)", [file]);
  }

  await conn.end();
  console.log("Готово.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

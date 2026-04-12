import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function requireConfig(): mysql.PoolOptions | string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;

  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  if (!user || !database) {
    throw new Error(
      "Задайте DATABASE_URL или пару MYSQL_USER + MYSQL_DATABASE (и при необходимости MYSQL_HOST, MYSQL_PORT, MYSQL_PASSWORD).",
    );
  }

  return {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password: process.env.MYSQL_PASSWORD ?? "",
    database,
    waitForConnections: true,
    connectionLimit: 10,
  };
}

export function getPool(): mysql.Pool {
  if (!pool) {
    const cfg = requireConfig();
    pool = typeof cfg === "string" ? mysql.createPool(cfg) : mysql.createPool(cfg);
  }
  return pool;
}

import type { UserRow } from "@/lib/auth/types";

/**
 * Доступна ли оплата на сайте (Moneta): `users.is_their = 1` (миграция 009).
 * mysql2 может отдать TINYINT как number, bigint, строку или Buffer — учитываем всё это.
 */
export function userIsSitePayEligible(row: Pick<UserRow, "is_their">): boolean {
  const v = row.is_their as unknown;
  if (v === true) return true;
  if (v === false || v == null) return false;
  if (typeof v === "bigint") return v === BigInt(1);
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v) === 1;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "1" || t.toLowerCase() === "true";
  }
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(v)) {
    return v.length === 1 && v[0] === 1;
  }
  return false;
}

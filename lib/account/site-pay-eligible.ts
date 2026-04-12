import type { UserRow } from "@/lib/auth/types";

/** Доступна ли оплата на сайте (Moneta): колонка is_their = 1 после миграции 009. */
export function userIsSitePayEligible(row: Pick<UserRow, "is_their">): boolean {
  const v = row.is_their as unknown;
  if (v === true) return true;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1";
  return false;
}

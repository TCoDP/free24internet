import type { UserRow } from "@/lib/auth/types";

const SUPERADMIN_USER_ID = 20;

/** Полный доступ в админ-панель: колонка is_admin или фиксированный суперпользователь. */
export function userIsAdmin(row: Pick<UserRow, "id" | "is_admin"> | null | undefined): boolean {
  if (!row) return false;
  if (row.id === SUPERADMIN_USER_ID) return true;
  const v = row.is_admin as unknown;
  return v === 1 || v === true || v === "1";
}

export function isProtectedSuperadminUserId(userId: number): boolean {
  return userId === SUPERADMIN_USER_ID;
}

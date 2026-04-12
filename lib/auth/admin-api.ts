import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { userIsAdmin } from "@/lib/auth/admin-access";
import { findUserById } from "@/lib/auth/users";

export async function assertAdminApi(): Promise<
  { userId: number } | NextResponse
> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const row = await findUserById(userId);
  if (!row || !userIsAdmin(row)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return { userId };
}

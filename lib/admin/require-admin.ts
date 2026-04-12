import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { userIsAdmin } from "@/lib/auth/admin-access";
import { findUserById } from "@/lib/auth/users";
import type { Locale } from "@/lib/messages/types";
import { pathPrefix } from "@/lib/locale";

export async function requireAdmin(locale: Locale): Promise<{ userId: number }> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    const p = pathPrefix(locale);
    const loginPath = p ? `${p}/login` : "/login";
    const nextPath = p ? `${p}/admin` : "/admin";
    redirect(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
  }
  const row = await findUserById(userId);
  if (!row || !userIsAdmin(row)) {
    const p = pathPrefix(locale);
    redirect(p ? `${p}/account/profile` : "/account/profile");
  }
  return { userId };
}

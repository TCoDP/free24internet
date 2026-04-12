import type { User } from "next-auth";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/lib/auth/users";

export async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>> | undefined,
): Promise<User | null> {
  if (!credentials?.email || !credentials?.password) return null;
  const email = String(credentials.email).trim();
  const password = String(credentials.password);
  if (!email || password.length < 8) return null;

  const row = await findUserByEmail(email);
  if (!row?.email || !row.password_hash) return null;
  if (!verifyPassword(password, row.password_hash)) return null;

  return {
    id: String(row.id),
    email: row.email,
    name: row.name ?? undefined,
  };
}

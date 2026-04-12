import { cache } from "react";
import { auth } from "@/auth";
import { ensureUserTrialInitialized, findUserById } from "@/lib/auth/users";

export const getAccountContext = cache(async () => {
  const session = await auth();
  const raw = session?.user?.id;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  await ensureUserTrialInitialized(id);
  const row = await findUserById(id);
  if (!row) return null;
  return { session, row };
});

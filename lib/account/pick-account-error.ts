import type { SiteMessages } from "@/lib/messages/types";

type ErrKey = keyof SiteMessages["auth"]["errors"];

export function pickAccountError(
  errors: SiteMessages["auth"]["errors"],
  code: string | undefined,
): string {
  if (!code) return errors.server;
  if (code in errors) return errors[code as ErrKey];
  return errors.server;
}

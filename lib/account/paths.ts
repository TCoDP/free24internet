import type { Locale } from "@/lib/messages/types";
import { pathPrefix } from "@/lib/locale";

export type AccountSection = "profile" | "plans" | "language" | "security" | "tickets" | "referrals";

export function accountBasePath(locale: Locale): string {
  return `${pathPrefix(locale)}/account`;
}

export function accountSectionPath(locale: Locale, section: AccountSection): string {
  return `${accountBasePath(locale)}/${section}`;
}

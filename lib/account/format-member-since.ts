import type { Locale } from "@/lib/messages/types";

export function formatMemberSince(value: Date | string, locale: Locale): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

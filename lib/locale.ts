export type Locale = "ru" | "en";

export function pathPrefix(locale: Locale): string {
  return locale === "en" ? "/en" : "";
}

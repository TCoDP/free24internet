import type { Locale } from "../locale";
import { en } from "./en";
import { ru } from "./ru";
import type { SiteMessages } from "./types";

export type { SiteMessages } from "./types";

export function getMessages(locale: Locale): SiteMessages {
  return locale === "en" ? en : ru;
}

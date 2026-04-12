"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function HtmlLang() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = pathname.startsWith("/en") ? "en" : "ru";
  }, [pathname]);
  return null;
}

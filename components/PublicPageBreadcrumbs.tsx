"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import type { SiteMessages } from "@/lib/messages/types";

type PublicKind = "login" | "register" | "terms" | "privacy";

function matchPublicKind(path: string): PublicKind | null {
  switch (path) {
    case "/login":
    case "/en/login":
      return "login";
    case "/register":
    case "/en/register":
      return "register";
    case "/terms":
    case "/en/terms":
      return "terms";
    case "/privacy":
    case "/en/privacy":
      return "privacy";
    default:
      return null;
  }
}

function kindLabel(kind: PublicKind, messages: SiteMessages): string {
  const b = messages.breadcrumb;
  switch (kind) {
    case "login":
      return b.login;
    case "register":
      return b.register;
    case "terms":
      return b.terms;
    case "privacy":
      return b.privacy;
  }
}

/**
 * Хлебные крошки для публичных страниц (вход, регистрация, оферта, политика).
 * В кабинете (/account) не показывается — там свои крошки.
 */
export function PublicPageBreadcrumbs({
  messages,
  className,
}: {
  messages: SiteMessages;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const p = pathname.replace(/\/$/, "") || "/";

  if (
    p.startsWith("/account") ||
    p.startsWith("/en/account") ||
    p.startsWith("/admin") ||
    p.startsWith("/en/admin")
  ) {
    return null;
  }

  const kind = matchPublicKind(p);
  if (!kind) return null;

  const homeHref = messages.locale === "en" ? "/en" : "/";

  return (
    <BreadcrumbTrail
      ariaLabel={messages.breadcrumb.ariaLabel}
      className={className ?? "mb-6"}
      items={[
        { href: homeHref, label: messages.breadcrumb.home },
        { label: kindLabel(kind, messages) },
      ]}
    />
  );
}

"use client";

import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";
import { usePathname } from "next/navigation";
import type { SiteMessages } from "@/lib/messages/types";
import { accountBasePath } from "@/lib/account/paths";

type Crumb = { href?: string; label: string };

function accountPathRest(pathname: string): string[] | null {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/account" || p === "/en/account") return [];
  if (p.startsWith("/en/account/")) {
    return p.slice("/en/account/".length).split("/").filter(Boolean);
  }
  if (p.startsWith("/account/")) {
    return p.slice("/account/".length).split("/").filter(Boolean);
  }
  return null;
}

function labelForSegment(
  rest: string[],
  index: number,
  messages: SiteMessages,
): string {
  const seg = rest[index];
  const prev = rest[index - 1];
  if (prev === "tickets" && seg === "new") {
    return messages.supportTickets.newTicket;
  }
  if (prev === "tickets" && /^\d+$/.test(seg)) {
    return `${messages.supportTickets.ticketPrefix} #${seg}`;
  }
  const a = messages.auth;
  switch (seg) {
    case "profile":
      return a.accountSectionProfile;
    case "plans":
      return a.accountTabPlans;
    case "language":
      return a.accountTabLanguage;
    case "security":
      return a.accountSectionSecurity;
    case "referrals":
      return a.accountTabReferrals;
    case "tickets":
      return a.accountTabTickets;
    default:
      return seg;
  }
}

export function AccountBreadcrumbs({ messages }: { messages: SiteMessages }) {
  const pathname = usePathname() ?? "";
  const rest = accountPathRest(pathname);
  if (rest == null) return null;

  const locale = messages.locale;
  const homeHref = locale === "en" ? "/en" : "/";
  const base = accountBasePath(locale);

  const items: Crumb[] = [{ href: homeHref, label: messages.breadcrumb.home }];

  if (rest.length === 0) {
    items.push({ label: messages.auth.accountTitle });
  } else {
    items.push({ href: base, label: messages.auth.accountTitle });
    let acc = base;
    for (let i = 0; i < rest.length; i++) {
      acc += `/${rest[i]}`;
      const isLast = i === rest.length - 1;
      items.push({
        href: isLast ? undefined : acc,
        label: labelForSegment(rest, i, messages),
      });
    }
  }

  return (
    <BreadcrumbTrail
      ariaLabel={messages.breadcrumb.ariaLabel}
      className="mb-6"
      items={items}
    />
  );
}

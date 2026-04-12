"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteMessages } from "@/lib/messages/types";
import type { AccountSection } from "@/lib/account/paths";
import { accountSectionPath } from "@/lib/account/paths";

const sections: {
  id: AccountSection;
  labelKey:
    | "accountSectionProfile"
    | "accountTabPlans"
    | "accountTabLanguage"
    | "accountSectionSecurity"
    | "accountTabTickets"
    | "accountTabReferrals";
}[] = [
  { id: "profile", labelKey: "accountSectionProfile" },
  { id: "plans", labelKey: "accountTabPlans" },
  { id: "language", labelKey: "accountTabLanguage" },
  { id: "security", labelKey: "accountSectionSecurity" },
  { id: "referrals", labelKey: "accountTabReferrals" },
  { id: "tickets", labelKey: "accountTabTickets" },
];

function tabActive(pathname: string, href: string, id: AccountSection): boolean {
  if (id === "tickets") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}

export function AccountTabNav({ messages }: { messages: SiteMessages }) {
  const pathname = usePathname();
  const locale = messages.locale;

  return (
    <nav className="flex flex-wrap gap-2 sm:gap-3" aria-label={messages.auth.accountSettingsTitle}>
      {sections.map(({ id, labelKey }) => {
        const href = accountSectionPath(locale, id);
        const active = tabActive(pathname, href, id);
        return (
          <Link
            key={id}
            href={href}
            scroll={false}
            className={`relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-5 sm:text-base ${
              active
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white hover:text-dark hover:ring-slate-300"
            }`}
          >
            {messages.auth[labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}

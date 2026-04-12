import type { Metadata } from "next";
import { AccountPasswordEditor } from "@/components/account/AccountPasswordEditor";
import { getAccountContext } from "@/lib/account/get-account-context";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("en");
  return {
    title: `${messages.auth.accountSectionSecurity} — ${messages.auth.accountTitle}`,
    alternates: { canonical: `${SITE_ORIGIN}/en/account/security` },
  };
}

export default async function EnAccountSecurityPage() {
  const messages = getMessages("en");
  const ctx = await getAccountContext();
  if (!ctx) return null;
  const hasPassword = Boolean(ctx.row.password_hash);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-black tracking-tight text-dark sm:text-2xl">
          {messages.auth.accountSectionSecurity}
        </h2>
      </header>
      <AccountPasswordEditor messages={messages} hasPassword={hasPassword} />
    </div>
  );
}

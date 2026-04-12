import type { Metadata } from "next";
import { AccountLanguageSwitcher } from "@/components/account/AccountLanguageSwitcher";
import { getAccountContext } from "@/lib/account/get-account-context";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("ru");
  return {
    title: `${messages.auth.accountTabLanguage} — ${messages.auth.accountTitle}`,
    alternates: { canonical: `${SITE_ORIGIN}/account/language` },
  };
}

export default async function AccountLanguagePage() {
  const messages = getMessages("ru");
  const ctx = await getAccountContext();
  if (!ctx) return null;
  const { row } = ctx;
  const storedLanguage =
    row.language === "en" || row.language === "ru" ? row.language : messages.locale;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-black tracking-tight text-dark sm:text-2xl">
          {messages.auth.accountSectionLanguage}
        </h2>
      </header>
      <AccountLanguageSwitcher messages={messages} storedLanguage={storedLanguage} />
    </div>
  );
}

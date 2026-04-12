import type { Metadata } from "next";
import { AccountProfileBuyButton } from "@/components/account/AccountProfileBuyButton";
import { AccountProfileInfoCards } from "@/components/account/AccountProfileInfoCards";
import { AccountProfileNameForm } from "@/components/account/AccountProfileNameForm";
import { TelegramAccountLink } from "@/components/account/TelegramAccountLink";
import { getAccountContext } from "@/lib/account/get-account-context";
import { userIsSitePayEligible } from "@/lib/account/site-pay-eligible";
import { formatMemberSince } from "@/lib/account/format-member-since";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { getPricingConfig } from "@/lib/pricing/load-pricing";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("ru");
  return {
    title: `${messages.auth.accountSectionProfile} — ${messages.auth.accountTitle}`,
    alternates: { canonical: `${SITE_ORIGIN}/account/profile` },
  };
}

export default async function AccountProfilePage() {
  const messages = getMessages("ru");
  const pricing = await getPricingConfig();
  const ctx = await getAccountContext();
  if (!ctx) return null;
  const { row } = ctx;

  const emailDisplay = row.email?.trim() ?? "";
  const tgDisplay = row.tg_username?.trim() ? `@${row.tg_username!.trim()}` : null;
  const tgLinked = row.tg_id != null && Number(row.tg_id) > 0;
  const botConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  const webhookConfigured = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim());

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-xl font-black tracking-tight text-dark sm:text-2xl">
          {messages.auth.accountSectionProfile}
        </h2>
      </header>
      <AccountProfileInfoCards
        messages={messages}
        emailDisplay={emailDisplay}
        tgDisplay={tgDisplay}
        userId={String(row.id)}
        memberSinceFormatted={formatMemberSince(row.created_at, messages.locale)}
      />
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wide text-primary">
          {messages.auth.accountAccessTitle}
        </h3>
        <div className="mt-4 space-y-4 text-sm">
          {row.trial_ends_at ? (
            <div>
              <p className="font-bold text-slate-500">{messages.auth.accountTrialUntil}</p>
              <p className="mt-1 font-semibold text-dark">
                {new Date(row.trial_ends_at).toLocaleString(
                  messages.locale === "en" ? "en-GB" : "ru-RU",
                  { dateStyle: "long", timeStyle: "short" },
                )}
              </p>
            </div>
          ) : null}
          {row.subscription_until ? (
            <div>
              <p className="font-bold text-slate-500">{messages.auth.accountSubUntil}</p>
              <p className="mt-1 font-semibold text-dark">
                {new Date(row.subscription_until).toLocaleString(
                  messages.locale === "en" ? "en-GB" : "ru-RU",
                  { dateStyle: "long", timeStyle: "short" },
                )}
              </p>
            </div>
          ) : (
            <p className="text-slate-600">{messages.auth.accountAccessNone}</p>
          )}
          {userIsSitePayEligible(row) ? (
            <AccountProfileBuyButton messages={messages} pricing={pricing} />
          ) : null}
        </div>
      </section>
      <TelegramAccountLink
        messages={messages}
        botConfigured={botConfigured}
        webhookConfigured={webhookConfigured}
        linked={tgLinked}
        tgUsername={row.tg_username?.trim() || null}
      />
      <AccountProfileNameForm messages={messages} initialName={row.name?.trim() ?? ""} />
    </div>
  );
}

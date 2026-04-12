import type { Metadata } from "next";
import { AccountReferralsClient } from "@/components/account/AccountReferralsClient";
import { getAccountContext } from "@/lib/account/get-account-context";
import {
  countUsersReferredBy,
  ensureReferralCode,
  sumReferralBonusDaysGranted,
} from "@/lib/auth/users";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("ru");
  return {
    title: `${messages.auth.accountSectionReferrals} — ${messages.auth.accountTitle}`,
    alternates: { canonical: `${SITE_ORIGIN}/account/referrals` },
  };
}

export default async function AccountReferralsPage() {
  const messages = getMessages("ru");
  const ctx = await getAccountContext();
  if (!ctx) return null;
  const { row } = ctx;

  const code = await ensureReferralCode(row.id);
  const invitedCount = await countUsersReferredBy(row.id);
  const bonusDaysTotal = await sumReferralBonusDaysGranted(row.id);
  const hasReferrer = row.referred_by_user_id != null && Number(row.referred_by_user_id) > 0;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-black tracking-tight text-dark sm:text-2xl">{messages.auth.referralPageTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {messages.auth.referralPageBlurb}
        </p>
      </header>
      <AccountReferralsClient
        messages={messages}
        code={code}
        invitedCount={invitedCount}
        bonusDaysTotal={bonusDaysTotal}
        hasReferrer={hasReferrer}
      />
    </div>
  );
}

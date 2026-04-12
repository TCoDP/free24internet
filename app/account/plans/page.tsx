import type { Metadata } from "next";
import { AccountPlansTabs } from "@/components/account/AccountPlansTabs";
import { getAccountContext } from "@/lib/account/get-account-context";
import { userIsSitePayEligible } from "@/lib/account/site-pay-eligible";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { applyPricingToSiteMessages } from "@/lib/pricing/apply-pricing-to-messages";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { listUserTransactions } from "@/lib/payments/transactions";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("ru");
  return {
    title: `${messages.auth.accountSectionPlans} — ${messages.auth.accountTitle}`,
    alternates: { canonical: `${SITE_ORIGIN}/account/plans` },
  };
}

export default async function AccountPlansPage() {
  const pricing = await getPricingConfig();
  const messages = applyPricingToSiteMessages(getMessages("ru"), pricing);
  const ctx = await getAccountContext();
  if (!ctx) return null;

  const transactions = await listUserTransactions(ctx.row.id);

  return (
    <AccountPlansTabs
      messages={messages}
      transactions={transactions}
      pricing={pricing}
      canPayOnSite={userIsSitePayEligible(ctx.row)}
    />
  );
}

import type { Metadata } from "next";
import { AccountDashboardLayout } from "@/components/account/AccountDashboardLayout";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Account",
  description: "Your profile",
  alternates: { canonical: `${SITE_ORIGIN}/en/account` },
};

export default async function EnAccountLayout({ children }: { children: React.ReactNode }) {
  const messages = getMessages("en");
  return (
    <AccountDashboardLayout messages={messages} logoutLocale="en">
      {children}
    </AccountDashboardLayout>
  );
}

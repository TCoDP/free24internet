import type { Metadata } from "next";
import { AccountDashboardLayout } from "@/components/account/AccountDashboardLayout";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Профиль пользователя",
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const messages = getMessages("ru");
  return (
    <AccountDashboardLayout messages={messages} logoutLocale="ru">
      {children}
    </AccountDashboardLayout>
  );
}

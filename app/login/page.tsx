import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { SiteShell } from "@/components/SiteShell";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в личный кабинет",
};

export default async function LoginPage() {
  const messages = getMessages("ru");
  return (
    <SiteShell messages={messages}>
      <AuthCard messages={messages} title={messages.auth.loginTitle}>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <LoginForm
            messages={messages}
            telegramAuthEnabled={Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim())}
          />
        </Suspense>
      </AuthCard>
    </SiteShell>
  );
}

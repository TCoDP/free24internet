import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SiteShell } from "@/components/SiteShell";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создание аккаунта",
};

export default async function RegisterPage() {
  const messages = getMessages("ru");
  return (
    <SiteShell messages={messages}>
      <AuthCard messages={messages} title={messages.auth.registerTitle}>
        <Suspense fallback={<p className="text-center text-slate-500">…</p>}>
          <RegisterForm messages={messages} />
        </Suspense>
      </AuthCard>
    </SiteShell>
  );
}

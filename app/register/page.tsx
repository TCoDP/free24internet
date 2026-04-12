import type { Metadata } from "next";
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
      <AuthCard title={messages.auth.registerTitle}>
        <RegisterForm messages={messages} />
      </AuthCard>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Create account",
  description: "Register",
  alternates: { canonical: `${SITE_ORIGIN}/en/register` },
};

export default async function EnRegisterPage() {
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <AuthCard title={messages.auth.registerTitle}>
        <RegisterForm messages={messages} />
      </AuthCard>
    </SiteShell>
  );
}
